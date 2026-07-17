import { supabase } from '../lib/supabase'

const movementLabels = {
  initial: 'Stock initial',
  reception: 'RÃ©ception',
  distribution: 'Distribution',
}

const mapMovement = (row) => ({
  id: row.id,
  assemblyId: row.assembly_id,
  publicationId: row.publication_id,
  publicationName:
    row.publication_name ?? row.publications?.name ?? 'Publication',
  amount: Number(row.amount),
  type: movementLabels[row.movement_type] ?? row.movement_type,
  movementType: row.movement_type,
  createdBy: row.created_by,
  createdAt: row.created_at,
})

function requireAssemblyId(assemblyId) {
  if (!assemblyId) {
    throw new Error('Aucune assemblÃ©e nâ€™est sÃ©lectionnÃ©e.')
  }

  return assemblyId
}

export async function getStockMovements(assemblyId) {
  const safeAssemblyId = requireAssemblyId(assemblyId)

  const { data, error } = await supabase.rpc(
    'get_assembly_stock_movements',
    { p_assembly_id: safeAssemblyId },
  )

  if (error) {
    throw new Error(
      `Impossible de charger lâ€™historique : ${error.message}`,
    )
  }

  return (data ?? []).map(mapMovement)
}

export async function createStockMovement({
  publication,
  amount,
  movementType,
  assemblyId,
}) {
  const safeAssemblyId = requireAssemblyId(assemblyId)
  const numericAmount = Number(amount) || 0

  if (!numericAmount) {
    throw new Error('La quantitÃ© doit Ãªtre supÃ©rieure Ã  zÃ©ro.')
  }

  const { data: userData, error: userError } =
    await supabase.auth.getUser()

  if (userError || !userData?.user) {
    throw new Error(
      'Cette modification nÃ©cessite encore la connexion administrateur dans la V1.',
    )
  }

  const { data, error } = await supabase
    .from('stock_movements')
    .insert({
      assembly_id: safeAssemblyId,
      publication_id: publication.id,
      amount: numericAmount,
      movement_type: movementType,
      created_by: userData.user.id,
    })
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
    throw new Error(
      `Impossible dâ€™enregistrer le mouvement : ${error.message}`,
    )
  }

  return mapMovement(data)
}

