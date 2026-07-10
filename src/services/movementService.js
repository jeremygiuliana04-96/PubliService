import { supabase } from '../lib/supabase'
import { DEFAULT_ASSEMBLY_ID } from './publicationService'

const movementLabels = {
  initial: 'Stock initial',
  reception: 'Réception',
  distribution: 'Distribution',
}

const mapMovement = (row) => ({
  id: row.id,
  assemblyId: row.assembly_id,
  publicationId: row.publication_id,
  publicationName: row.publications?.name ?? 'Publication',
  amount: Number(row.amount),
  type: movementLabels[row.movement_type] ?? row.movement_type,
  movementType: row.movement_type,
  createdBy: row.created_by,
  createdAt: row.created_at,
})

export async function getStockMovements() {
  const { data, error } = await supabase
    .from('stock_movements')
    .select(`
      id,
      assembly_id,
      publication_id,
      amount,
      movement_type,
      created_by,
      created_at,
      publications(name)
    `)
    .eq('assembly_id', DEFAULT_ASSEMBLY_ID)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Impossible de charger l’historique : ${error.message}`)
  }

  return (data ?? []).map(mapMovement)
}

export async function createStockMovement({ publication, amount, movementType }) {
  const numericAmount = Number(amount) || 0
  if (!numericAmount) throw new Error('La quantité doit être supérieure à zéro.')

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    throw new Error('Votre session a expiré. Reconnectez-vous.')
  }

  const payload = {
    assembly_id: DEFAULT_ASSEMBLY_ID,
    publication_id: publication.id,
    amount: numericAmount,
    movement_type: movementType,
    created_by: userData.user.id,
  }

  const { data, error } = await supabase
    .from('stock_movements')
    .insert(payload)
    .select(`
      id,
      assembly_id,
      publication_id,
      amount,
      movement_type,
      created_by,
      created_at,
      publications(name)
    `)
    .single()

  if (error) {
    throw new Error(`Impossible d’enregistrer le mouvement : ${error.message}`)
  }

  return mapMovement(data)
}
