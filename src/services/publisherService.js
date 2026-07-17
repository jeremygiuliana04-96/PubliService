import { supabase } from '../lib/supabase'

const mapPublisher = (publisher) => ({
  id: publisher.id,
  assemblyId: publisher.assembly_id,
  firstName: publisher.first_name,
  lastName: publisher.last_name,
  gender: publisher.gender ?? '',
  phone: publisher.phone ?? '',
  email: publisher.email ?? '',
  active: publisher.active ?? true,
  createdAt: publisher.created_at,
})

function requireAssemblyAccess(assemblyId, accessCode) {
  if (!assemblyId) {
    throw new Error(
      'Aucune assemblée n’est sélectionnée.',
    )
  }

  const cleanCode = String(accessCode ?? '')
    .replace(/\D/g, '')

  if (cleanCode.length !== 6) {
    throw new Error(
      'Le code de l’assemblée est introuvable.',
    )
  }

  return {
    assemblyId,
    accessCode: cleanCode,
  }
}

export async function getPublishers(assemblyId) {
  if (!assemblyId) {
    throw new Error(
      'Aucune assemblée n’est sélectionnée.',
    )
  }

  const { data, error } = await supabase.rpc(
    'get_assembly_publishers',
    {
      p_assembly_id: assemblyId,
    },
  )

  if (error) {
    throw new Error(
      `Impossible de charger les proclamateurs : ${error.message}`,
    )
  }

  return (data ?? []).map(mapPublisher)
}

export async function createPublisher(
  publisher,
  assemblyId,
  accessCode,
) {
  const access = requireAssemblyAccess(
    assemblyId,
    accessCode,
  )

  const { data, error } = await supabase.rpc(
    'create_assembly_publisher',
    {
      p_assembly_id: access.assemblyId,
      p_code: access.accessCode,
      p_first_name: publisher.firstName.trim(),
      p_last_name: publisher.lastName.trim(),
      p_gender: publisher.gender || null,
      p_phone: publisher.phone?.trim() || null,
      p_email:
        publisher.email?.trim().toLowerCase() || null,
    },
  )

  if (error) {
    throw new Error(
      `Impossible d’ajouter le proclamateur : ${error.message}`,
    )
  }

  const created = Array.isArray(data)
    ? data[0]
    : data

  return mapPublisher(created)
}

export async function updatePublisher(
  id,
  publisher,
  assemblyId,
  accessCode,
) {
  const access = requireAssemblyAccess(
    assemblyId,
    accessCode,
  )

  const { data, error } = await supabase.rpc(
    'update_assembly_publisher',
    {
      p_assembly_id: access.assemblyId,
      p_code: access.accessCode,
      p_publisher_id: id,
      p_first_name: publisher.firstName.trim(),
      p_last_name: publisher.lastName.trim(),
      p_gender: publisher.gender || null,
      p_phone: publisher.phone?.trim() || null,
      p_email:
        publisher.email?.trim().toLowerCase() || null,
    },
  )

  if (error) {
    throw new Error(
      `Impossible de modifier le proclamateur : ${error.message}`,
    )
  }

  const updated = Array.isArray(data)
    ? data[0]
    : data

  return mapPublisher(updated)
}

export async function deletePublisher(
  id,
  assemblyId,
  accessCode,
) {
  const access = requireAssemblyAccess(
    assemblyId,
    accessCode,
  )

  const { error } = await supabase.rpc(
    'delete_assembly_publisher',
    {
      p_assembly_id: access.assemblyId,
      p_code: access.accessCode,
      p_publisher_id: id,
    },
  )

  if (error) {
    throw new Error(
      `Impossible de supprimer le proclamateur : ${error.message}`,
    )
  }
}

