import { supabase } from '../lib/supabase'

const mapPublisherPublication = (item) => ({
  id: item.id,
  publisherId: item.publisher_id,
  publicationId: item.publication_id,
  orderedQuantity: Number(item.ordered_quantity ?? 0),
  distributedQuantity: Number(item.distributed_quantity ?? 0),
  createdAt: item.created_at,
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

export async function getPublisherPublications(
  publisherId,
  assemblyId,
  accessCode,
) {
  const access = requireAssemblyAccess(
    assemblyId,
    accessCode,
  )

  const { data, error } = await supabase.rpc(
    'get_assembly_publisher_publications',
    {
      p_assembly_id: access.assemblyId,
      p_code: access.accessCode,
      p_publisher_id: publisherId,
    },
  )

  if (error) {
    throw new Error(
      `Impossible de charger les publications du proclamateur : ${error.message}`,
    )
  }

  return (data ?? []).map(mapPublisherPublication)
}

export async function savePublisherPublication({
  publisherId,
  publicationId,
  orderedQuantity,
  distributedQuantity,
  assemblyId,
  accessCode,
}) {
  const access = requireAssemblyAccess(
    assemblyId,
    accessCode,
  )

  const { data, error } = await supabase.rpc(
    'save_assembly_publisher_publication',
    {
      p_assembly_id: access.assemblyId,
      p_code: access.accessCode,
      p_publisher_id: publisherId,
      p_publication_id: publicationId,
      p_ordered_quantity:
        Math.max(0, Number(orderedQuantity) || 0),
      p_distributed_quantity:
        Math.max(0, Number(distributedQuantity) || 0),
    },
  )

  if (error) {
    throw new Error(
      `Impossible d’enregistrer la publication : ${error.message}`,
    )
  }

  const saved = Array.isArray(data)
    ? data[0]
    : data

  return saved
    ? mapPublisherPublication(saved)
    : null
}

export async function saveAllPublisherPublications(
  publisherId,
  publicationQuantities,
  assemblyId,
  accessCode,
) {
  const results = []

  for (const item of publicationQuantities) {
    const result = await savePublisherPublication({
      publisherId,
      publicationId: item.publicationId,
      orderedQuantity: item.orderedQuantity,
      distributedQuantity:
        item.distributedQuantity,
      assemblyId,
      accessCode,
    })

    if (result) results.push(result)
  }

  return results
}

