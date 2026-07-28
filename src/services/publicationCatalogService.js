import { supabase } from '../lib/supabase'

const mapCatalogEntry = (entry) => ({
  id: entry.id,
  assemblyId: entry.assembly_id,
  name: entry.name,
  hasDate: Boolean(entry.has_date),
  isActive: entry.is_active !== false,
  createdAt: entry.created_at,
})

export async function getPublicationCatalog(assemblyId) {
  if (!assemblyId) {
    throw new Error('Aucune assemblée n’est sélectionnée.')
  }

  const { data, error } = await supabase
    .from('publication_catalog')
    .select(
      'id, assembly_id, name, has_date, is_active, created_at',
    )
    .eq('assembly_id', assemblyId)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    throw new Error(
      `Impossible de charger le catalogue : ${error.message}`,
    )
  }

  return (data ?? []).map(mapCatalogEntry)
}

export async function createPublicationCatalogEntry({
  assemblyId,
  name,
  hasDate,
}) {
  const cleanName = String(name ?? '').trim()

  if (!assemblyId || !cleanName) {
    throw new Error('Le nom de la publication est obligatoire.')
  }

  const { data, error } = await supabase
    .from('publication_catalog')
    .insert({
      assembly_id: assemblyId,
      name: cleanName,
      has_date: Boolean(hasDate),
    })
    .select(
      'id, assembly_id, name, has_date, is_active, created_at',
    )
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error(
        'Cette publication existe déjà dans le catalogue.',
      )
    }

    throw new Error(
      `Impossible de créer la publication : ${error.message}`,
    )
  }

  return mapCatalogEntry(data)
}
