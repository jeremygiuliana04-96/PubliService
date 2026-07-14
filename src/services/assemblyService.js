import { supabase } from '../lib/supabase'

const mapAssembly = (assembly) => ({
  id: assembly.id,
  name: assembly.name,
  isActive: assembly.is_active ?? true,
  code: assembly.assembly_codes?.[0]?.current_code ?? '',
  createdAt: assembly.created_at,
  updatedAt: assembly.updated_at,
})

const generateAccessCode = () =>
  String(Math.floor(100000 + Math.random() * 900000))

const hashCode = async (code) => {
  const encodedCode = new TextEncoder().encode(code)
  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    encodedCode,
  )

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export async function getAssemblies() {
  const { data, error } = await supabase
    .from('assemblies')
    .select(`
      id,
      name,
      is_active,
      created_at,
      updated_at,
      assembly_codes (
        current_code
      )
    `)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    throw new Error(
      `Impossible de charger les assemblées : ${error.message}`,
    )
  }

  return (data ?? []).map(mapAssembly)
}

async function codeAlreadyExists(code) {
  const { count, error } = await supabase
    .from('assembly_codes')
    .select('assembly_id', {
      count: 'exact',
      head: true,
    })
    .eq('current_code', code)

  if (error) {
    throw new Error(
      `Impossible de vérifier le code d’accès : ${error.message}`,
    )
  }

  return (count ?? 0) > 0
}

export async function generateUniqueAssemblyCode() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = generateAccessCode()

    if (!(await codeAlreadyExists(code))) {
      return code
    }
  }

  throw new Error(
    'Impossible de générer un code unique. Réessaie.',
  )
}

export async function createAssembly({
  name,
  code: requestedCode,
}) {
  const cleanName = name.trim()

  if (!cleanName) {
    throw new Error('Le nom de l’assemblée est obligatoire.')
  }

  const cleanRequestedCode = requestedCode
    ? String(requestedCode).replace(/\D/g, '')
    : ''

  if (
    cleanRequestedCode &&
    cleanRequestedCode.length !== 6
  ) {
    throw new Error(
      'Le code d’accès doit contenir exactement 6 chiffres.',
    )
  }

  const accessCode =
    cleanRequestedCode || (await generateUniqueAssemblyCode())

  if (await codeAlreadyExists(accessCode)) {
    throw new Error(
      'Ce code d’accès est déjà utilisé par une autre assemblée.',
    )
  }

  const { data: assembly, error: assemblyError } =
    await supabase
      .from('assemblies')
      .insert({
        name: cleanName,
        is_active: true,
      })
      .select()
      .single()

  if (assemblyError) {
    throw new Error(
      `Impossible de créer l’assemblée : ${assemblyError.message}`,
    )
  }

  const codeHash = await hashCode(accessCode)

  const { error: codeError } = await supabase
    .from('assembly_codes')
    .insert({
      assembly_id: assembly.id,
      current_code: accessCode,
      code_hash: codeHash,
      updated_at: new Date().toISOString(),
    })

  if (codeError) {
    await supabase
      .from('assemblies')
      .delete()
      .eq('id', assembly.id)

    throw new Error(
      `Impossible de créer le code d’accès : ${codeError.message}`,
    )
  }

  return {
    ...mapAssembly(assembly),
    code: accessCode,
  }
}

export async function updateAssemblyName(
  assemblyId,
  name,
) {
  const cleanName = name.trim()

  if (!cleanName) {
    throw new Error('Le nom de l’assemblée est obligatoire.')
  }

  const { data, error } = await supabase
    .from('assemblies')
    .update({
      name: cleanName,
      updated_at: new Date().toISOString(),
    })
    .eq('id', assemblyId)
    .select()
    .single()

  if (error) {
    throw new Error(
      `Impossible de modifier l’assemblée : ${error.message}`,
    )
  }

  return mapAssembly(data)
}

export async function regenerateAssemblyCode(assemblyId) {
  const accessCode = await generateUniqueAssemblyCode()
  const codeHash = await hashCode(accessCode)

  const { error } = await supabase
    .from('assembly_codes')
    .upsert(
      {
        assembly_id: assemblyId,
        current_code: accessCode,
        code_hash: codeHash,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'assembly_id',
      },
    )

  if (error) {
    throw new Error(
      `Impossible de régénérer le code : ${error.message}`,
    )
  }

  return accessCode
}

export async function archiveAssembly(assemblyId) {
  const { error } = await supabase
    .from('assemblies')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', assemblyId)

  if (error) {
    throw new Error(
      `Impossible d’archiver l’assemblée : ${error.message}`,
    )
  }
}