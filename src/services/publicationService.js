import { supabase } from '../lib/supabase'

export const DEFAULT_ASSEMBLY_ID = 'be7ab216-ae11-4e65-b523-d7b9d5221199'

const mapPublication = (row) => ({
  id: row.id,
  assemblyId: row.assembly_id,
  name: row.name,
  stock: Number(row.stock ?? 0),
  minimum: Number(row.minimum_stock ?? 10),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export async function getPublications() {
  const { data, error } = await supabase
    .from('publications')
    .select('id, assembly_id, name, stock, minimum_stock, created_at, updated_at')
    .eq('assembly_id', DEFAULT_ASSEMBLY_ID)
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Impossible de charger l’inventaire : ${error.message}`)
  }

  return (data ?? []).map(mapPublication)
}

export async function createPublication({ name, stock = 0, minimum = 10 }) {
  const payload = {
    assembly_id: DEFAULT_ASSEMBLY_ID,
    name: name.trim(),
    stock: Math.max(0, Number(stock) || 0),
    minimum_stock: Math.max(0, Number(minimum) || 10),
  }

  const { data, error } = await supabase
    .from('publications')
    .insert(payload)
    .select('id, assembly_id, name, stock, minimum_stock, created_at, updated_at')
    .single()

  if (error) {
    throw new Error(`Impossible d’ajouter la publication : ${error.message}`)
  }

  return mapPublication(data)
}

export async function updatePublicationStock(publication, amount) {
  const numericAmount = Number(amount) || 0
  if (!numericAmount) return publication

  const nextStock = Math.max(0, publication.stock + numericAmount)

  const { data, error } = await supabase
    .from('publications')
    .update({ stock: nextStock })
    .eq('id', publication.id)
    .eq('assembly_id', DEFAULT_ASSEMBLY_ID)
    .select('id, assembly_id, name, stock, minimum_stock, created_at, updated_at')
    .single()

  if (error) {
    throw new Error(`Impossible de modifier le stock : ${error.message}`)
  }

  return mapPublication(data)
}
