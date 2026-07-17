import { supabase } from '../lib/supabase'

export const DEFAULT_ASSEMBLY_ID =
  'be7ab216-ae11-4e65-b523-d7b9d5221199'

const mapPublication = (publication) => ({
  id: publication.id,
  assemblyId: publication.assembly_id,
  name: publication.name,
  stock: Number(publication.stock ?? 0),
  createdAt: publication.created_at,
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

export async function getPublications(assemblyId) {
  if (!assemblyId) {
    throw new Error(
      'Aucune assemblée n’est sélectionnée.',
    )
  }

  const { data, error } = await supabase.rpc(
    'get_assembly_publications',
    {
      p_assembly_id: assemblyId,
    },
  )

  if (error) {
    throw new Error(
      `Impossible de charger les publications : ${error.message}`,
    )
  }

  return (data ?? []).map(mapPublication)
}

export async function createPublication(
  publication,
  assemblyId,
  accessCode,
) {
  const access = requireAssemblyAccess(
    assemblyId,
    accessCode,
  )

  const { data, error } = await supabase.rpc(
    'create_assembly_publication',
    {
      p_assembly_id: access.assemblyId,
      p_code: access.accessCode,
      p_name: publication.name.trim(),
      p_stock: Math.max(
        0,
        Number(publication.stock) || 0,
      ),
    },
  )

  if (error) {
    throw new Error(
      `Impossible d’ajouter la publication : ${error.message}`,
    )
  }

  const created = Array.isArray(data)
    ? data[0]
    : data

  if (!created) {
    throw new Error(
      'La publication n’a pas pu être créée.',
    )
  }

  return mapPublication(created)
}

export async function updatePublicationStock(
  publication,
  amount,
  assemblyId,
  accessCode,
) {
  const access = requireAssemblyAccess(
    assemblyId,
    accessCode,
  )

  const { data, error } = await supabase.rpc(
    'change_assembly_publication_stock',
    {
      p_assembly_id: access.assemblyId,
      p_code: access.accessCode,
      p_publication_id: publication.id,
      p_amount: Number(amount) || 0,
    },
  )

  if (error) {
    throw new Error(
      `Impossible de modifier le stock : ${error.message}`,
    )
  }

  const updated = Array.isArray(data)
    ? data[0]
    : data

  if (!updated) {
    throw new Error(
      'Le stock n’a pas pu être modifié.',
    )
  }

  return mapPublication(updated)
}

export async function deletePublication(
  id,
  assemblyId,
  accessCode,
) {
  const access = requireAssemblyAccess(
    assemblyId,
    accessCode,
  )

  const { error } = await supabase.rpc(
    'delete_assembly_publication',
    {
      p_assembly_id: access.assemblyId,
      p_code: access.accessCode,
      p_publication_id: id,
    },
  )

  if (error) {
    throw new Error(
      `Impossible de supprimer la publication : ${error.message}`,
    )
  }
}

