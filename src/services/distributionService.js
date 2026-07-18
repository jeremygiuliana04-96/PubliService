import { supabase } from '../lib/supabase'

function requireAssemblyAccess(assemblyId, accessCode) {
  if (!assemblyId) {
    throw new Error("Aucune assemblée n'est sélectionnée.")
  }

  const cleanCode = String(accessCode ?? '').replace(/\D/g, '')

  if (cleanCode.length !== 6) {
    throw new Error("Le code d'accès de l'assemblée est introuvable.")
  }

  return {
    assemblyId,
    accessCode: cleanCode,
  }
}

function mapPendingDistribution(item) {
  return {
    publisherId: item.publisher_id,
    publisherFirstName: item.publisher_first_name,
    publisherLastName: item.publisher_last_name,

    publicationId: item.publication_id,
    publicationName: item.publication_name,

    publicationType: item.publication_type,
    publicationLanguage: item.publication_language,
    publicationFormat: item.publication_format,

    publicationMonth: Number(item.publication_month ?? 0),
    publicationYear: Number(item.publication_year ?? 0),

    requestedQuantity: Number(item.requested_quantity ?? 0),
    alreadyDistributedQuantity: Number(
      item.already_distributed_quantity ?? 0,
    ),
    remainingQuantity: Number(item.remaining_quantity ?? 0),
    availableStock: Number(item.available_stock ?? 0),
  }
}

function mapDistribution(item) {
  return {
    distributionId: item.distribution_id,
    publisherId: item.publisher_id,
    publicationId: item.publication_id,

    orderedQuantity: Number(item.ordered_quantity ?? 0),
    distributedQuantity: Number(
      item.distributed_quantity ?? 0,
    ),
    remainingQuantity: Number(item.remaining_quantity ?? 0),
    remainingStock: Number(item.remaining_stock ?? 0),
  }
}

export async function getPendingDistributions(
  assemblyId,
  accessCode,
) {
  const access = requireAssemblyAccess(
    assemblyId,
    accessCode,
  )

  const { data, error } = await supabase.rpc(
    'get_assembly_pending_distributions',
    {
      p_assembly_id: access.assemblyId,
      p_code: access.accessCode,
    },
  )

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map(mapPendingDistribution)
}

export async function distributePublication({
  assemblyId,
  accessCode,
  publisherId,
  publicationId,
  quantity,
}) {
  const access = requireAssemblyAccess(
    assemblyId,
    accessCode,
  )

  const { data, error } = await supabase.rpc(
    'distribute_assembly_publication',
    {
      p_assembly_id: access.assemblyId,
      p_code: access.accessCode,
      p_publisher_id: publisherId,
      p_publication_id: publicationId,
      p_quantity: quantity,
    },
  )

  if (error) {
    throw new Error(error.message)
  }

  return Array.isArray(data)
    ? mapDistribution(data[0])
    : mapDistribution(data)
}

export async function distributeAllRemaining({
  assemblyId,
  accessCode,
  publisherId,
  publicationId,
}) {
  const access = requireAssemblyAccess(
    assemblyId,
    accessCode,
  )

  const { data, error } = await supabase.rpc(
    'distribute_all_remaining_assembly_publication',
    {
      p_assembly_id: access.assemblyId,
      p_code: access.accessCode,
      p_publisher_id: publisherId,
      p_publication_id: publicationId,
    },
  )

  if (error) {
    throw new Error(error.message)
  }

  return Array.isArray(data)
    ? mapDistribution(data[0])
    : mapDistribution(data)
}