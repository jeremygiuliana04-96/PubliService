import { supabase } from '../lib/supabase'

export const DEFAULT_ASSEMBLY_ID =
  'be7ab216-ae11-4e65-b523-d7b9d5221199'

export const DEFAULT_PUBLICATION_NAMES = [
  'Tour de Garde d’étude',
  'Cahier Vie et Ministère',
]

const mapPublication = (publication) => ({
  id: publication.id,
  assemblyId: publication.assembly_id,
  name: publication.name,
  stock: Number(publication.stock ?? 0),
    createdAt: publication.created_at,
})

export async function ensureDefaultPublications() {
  const { data: existing, error: loadError } = await supabase
    .from('publications')
    .select('*')
    .eq('assembly_id', DEFAULT_ASSEMBLY_ID)

  if (loadError) {
    throw new Error(
      `Impossible de vérifier les publications : ${loadError.message}`,
    )
  }

  const existingNames = new Set(
    (existing ?? []).map((item) => item.name.trim().toLowerCase()),
  )

  const missingNames = DEFAULT_PUBLICATION_NAMES.filter(
    (name) => !existingNames.has(name.toLowerCase()),
  )

  if (missingNames.length > 0) {
    const { error: insertError } = await supabase
      .from('publications')
      .insert(
        missingNames.map((name) => ({
          assembly_id: DEFAULT_ASSEMBLY_ID,
          name,
          stock: 0,
        })),
      )

    if (insertError) {
      throw new Error(
        `Impossible de créer les publications principales : ${insertError.message}`,
      )
    }
  }
}

export async function getPublications() {
  await ensureDefaultPublications()

  const { data, error } = await supabase
    .from('publications')
    .select('*')
    .eq('assembly_id', DEFAULT_ASSEMBLY_ID)
    .order('name', { ascending: true })

  if (error) {
    throw new Error(
      `Impossible de charger les publications : ${error.message}`,
    )
  }

  return (data ?? []).map(mapPublication)
}

export async function createPublication(publication) {
  const { data, error } = await supabase
    .from('publications')
    .insert({
      assembly_id: DEFAULT_ASSEMBLY_ID,
      name: publication.name.trim(),
      stock: Math.max(0, Number(publication.stock) || 0),
    })
    .select()
    .single()

  if (error) {
    throw new Error(
      `Impossible d’ajouter la publication : ${error.message}`,
    )
  }

  return mapPublication(data)
}

export async function updatePublicationStock(publication, amount) {
  const nextStock =
    Number(publication.stock ?? 0) + Number(amount ?? 0)

  if (nextStock < 0) {
    throw new Error('Le stock ne peut pas être négatif.')
  }

  const { data, error } = await supabase
    .from('publications')
    .update({
      stock: nextStock,
    })
    .eq('id', publication.id)
    .eq('assembly_id', DEFAULT_ASSEMBLY_ID)
    .select()
    .single()

  if (error) {
    throw new Error(
      `Impossible de modifier le stock : ${error.message}`,
    )
  }

  return mapPublication(data)
}



export async function deletePublication(id) {
  const { count, error: countError } = await supabase
    .from('publisher_publications')
    .select('id', { count: 'exact', head: true })
    .eq('publication_id', id)

  if (countError) {
    throw new Error(
      `Impossible de vérifier la publication : ${countError.message}`,
    )
  }

  if ((count ?? 0) > 0) {
    throw new Error(
      'Cette publication est encore attribuée à un ou plusieurs proclamateurs.',
    )
  }

  const { error } = await supabase
    .from('publications')
    .delete()
    .eq('id', id)
    .eq('assembly_id', DEFAULT_ASSEMBLY_ID)

  if (error) {
    throw new Error(
      `Impossible de supprimer la publication : ${error.message}`,
    )
  }
}
