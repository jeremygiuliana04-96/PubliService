import { supabase } from '../lib/supabase'

const mapPublisherPublication = (item) => ({
  id: item.id,
  publisherId: item.publisher_id,
  publicationId: item.publication_id,
  orderedQuantity: Number(item.ordered_quantity ?? 0),
  distributedQuantity: Number(item.distributed_quantity ?? 0),
  createdAt: item.created_at,
})

export async function getPublisherPublications(publisherId) {
  const { data, error } = await supabase
    .from('publisher_publications')
    .select('*')
    .eq('publisher_id', publisherId)

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
}) {
  const cleanOrderedQuantity = Math.max(
    0,
    Number(orderedQuantity) || 0,
  )

  const cleanDistributedQuantity = Math.max(
    0,
    Number(distributedQuantity) || 0,
  )

  const { data: existing, error: existingError } = await supabase
    .from('publisher_publications')
    .select('id')
    .eq('publisher_id', publisherId)
    .eq('publication_id', publicationId)
    .maybeSingle()

  if (existingError) {
    throw new Error(
      `Impossible de vérifier la publication : ${existingError.message}`,
    )
  }

  if (
    cleanOrderedQuantity === 0 &&
    cleanDistributedQuantity === 0
  ) {
    if (!existing) return null

    const { error } = await supabase
      .from('publisher_publications')
      .delete()
      .eq('id', existing.id)

    if (error) {
      throw new Error(
        `Impossible de supprimer la publication : ${error.message}`,
      )
    }

    return null
  }

  if (existing) {
    const { data, error } = await supabase
      .from('publisher_publications')
      .update({
        ordered_quantity: cleanOrderedQuantity,
        distributed_quantity: cleanDistributedQuantity,
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      throw new Error(
        `Impossible de modifier la publication : ${error.message}`,
      )
    }

    return mapPublisherPublication(data)
  }

  const { data, error } = await supabase
    .from('publisher_publications')
    .insert({
      publisher_id: publisherId,
      publication_id: publicationId,
      ordered_quantity: cleanOrderedQuantity,
      distributed_quantity: cleanDistributedQuantity,
    })
    .select()
    .single()

  if (error) {
    throw new Error(
      `Impossible d’ajouter la publication : ${error.message}`,
    )
  }

  return mapPublisherPublication(data)
}

export async function saveAllPublisherPublications(
  publisherId,
  publicationQuantities,
) {
  const results = []

  for (const item of publicationQuantities) {
    const result = await savePublisherPublication({
      publisherId,
      publicationId: item.publicationId,
      orderedQuantity: item.orderedQuantity,
      distributedQuantity: item.distributedQuantity,
    })

    if (result) results.push(result)
  }

  return results
}
