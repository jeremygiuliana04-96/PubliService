import { supabase } from '../lib/supabase'

export const PUBLISHER_PREFERENCE_GROUPS = [
  {
    key: 'watchtower',
    label: 'Tour de Garde',
    icon: '📘',
    options: [
      { key: 'watchtower_fr_standard', label: 'Français', publicationType: 'watchtower', language: 'fr', format: 'standard' },
      { key: 'watchtower_fr_large', label: 'Français gros caractères', publicationType: 'watchtower', language: 'fr', format: 'large' },
      { key: 'watchtower_nl_standard', label: 'Néerlandais', publicationType: 'watchtower', language: 'nl', format: 'standard' },
      { key: 'watchtower_en_standard', label: 'Anglais', publicationType: 'watchtower', language: 'en', format: 'standard' },
      { key: 'watchtower_es_standard', label: 'Espagnol', publicationType: 'watchtower', language: 'es', format: 'standard' },
      { key: 'watchtower_it_standard', label: 'Italien', publicationType: 'watchtower', language: 'it', format: 'standard' },
      { key: 'watchtower_it_large', label: 'Italien gros caractères', publicationType: 'watchtower', language: 'it', format: 'large' },
    ],
  },
  {
    key: 'workbook',
    label: 'Cahier Vie et Ministère',
    icon: '📗',
    options: [
      { key: 'workbook_fr_standard', label: 'Français', publicationType: 'workbook', language: 'fr', format: 'standard' },
      { key: 'workbook_nl_standard', label: 'Néerlandais', publicationType: 'workbook', language: 'nl', format: 'standard' },
      { key: 'workbook_en_standard', label: 'Anglais', publicationType: 'workbook', language: 'en', format: 'standard' },
      { key: 'workbook_es_standard', label: 'Espagnol', publicationType: 'workbook', language: 'es', format: 'standard' },
      { key: 'workbook_it_standard', label: 'Italien', publicationType: 'workbook', language: 'it', format: 'standard' },
    ],
  },
]

const preferenceKey = (publicationType, language, format) =>
  `${publicationType}_${language}_${format}`

const mapPublisherPreference = (item) => ({
  id: item.id,
  publisherId: item.publisher_id,
  assemblyId: item.assembly_id,
  publicationType: item.publication_type,
  language: item.language,
  format: item.format,
  preferenceKey: preferenceKey(item.publication_type, item.language, item.format),
  quantity: Number(item.quantity ?? 0),
  createdAt: item.created_at,
  updatedAt: item.updated_at,
})

const mapPublisherPublication = (item) => ({
  id: item.id,
  publisherId: item.publisher_id,
  publicationId: item.publication_id,
  orderedQuantity: Number(item.ordered_quantity ?? 0),
  distributedQuantity: Number(item.distributed_quantity ?? 0),
  createdAt: item.created_at,
})

const mapDistributionHistory = (item) => ({
  distributionId: item.distribution_id,
  publicationId: item.publication_id,
  publicationName: item.publication_name,
  publicationType: item.publication_type,
  language: item.language,
  format: item.format,
  publicationMonth: Number(item.publication_month ?? 0),
  publicationYear: Number(item.publication_year ?? 0),
  quantity: Number(item.distributed_quantity ?? 0),
  distributedAt: item.distributed_at,
})

function requireAssemblyAccess(assemblyId, accessCode) {
  if (!assemblyId) throw new Error('Aucune assemblée n’est sélectionnée.')

  const cleanCode = String(accessCode ?? '').replace(/\D/g, '')
  if (cleanCode.length !== 6) throw new Error('Le code de l’assemblée est introuvable.')

  return { assemblyId, accessCode: cleanCode }
}

export async function getPublisherPreferences(publisherId, assemblyId, accessCode) {
  const access = requireAssemblyAccess(assemblyId, accessCode)
  const { data, error } = await supabase.rpc('get_assembly_publisher_preferences', {
    p_assembly_id: access.assemblyId,
    p_code: access.accessCode,
    p_publisher_id: publisherId,
  })

  if (error) throw new Error(`Impossible de charger les quantités habituelles : ${error.message}`)
  return (data ?? []).map(mapPublisherPreference)
}

export async function getPublisherDistributionHistory(publisherId, assemblyId, accessCode) {
  const access = requireAssemblyAccess(assemblyId, accessCode)
  const { data, error } = await supabase.rpc('get_assembly_publisher_distribution_history', {
    p_assembly_id: access.assemblyId,
    p_code: access.accessCode,
    p_publisher_id: publisherId,
  })

  if (error) throw new Error(`Impossible de charger l’historique : ${error.message}`)
  return (data ?? []).map(mapDistributionHistory)
}

export async function savePublisherPreference({
  publisherId,
  publicationType,
  language,
  format,
  quantity,
  assemblyId,
  accessCode,
}) {
  const access = requireAssemblyAccess(assemblyId, accessCode)
  const { data, error } = await supabase.rpc('save_assembly_publisher_preference', {
    p_assembly_id: access.assemblyId,
    p_code: access.accessCode,
    p_publisher_id: publisherId,
    p_publication_type: publicationType,
    p_language: language,
    p_format: format,
    p_quantity: Math.min(10, Math.max(0, Number(quantity) || 0)),
  })

  if (error) throw new Error(`Impossible d’enregistrer la quantité habituelle : ${error.message}`)
  const saved = Array.isArray(data) ? data[0] : data
  return saved ? mapPublisherPreference(saved) : null
}

export async function saveAllPublisherPreferences(publisherId, preferences, assemblyId, accessCode) {
  const results = []
  for (const preference of preferences) {
    const saved = await savePublisherPreference({
      publisherId,
      publicationType: preference.publicationType,
      language: preference.language,
      format: preference.format,
      quantity: preference.quantity,
      assemblyId,
      accessCode,
    })
    if (saved) results.push(saved)
  }
  return results
}

export async function getPublisherPublications(publisherId, assemblyId, accessCode) {
  const access = requireAssemblyAccess(assemblyId, accessCode)
  const { data, error } = await supabase.rpc('get_assembly_publisher_publications', {
    p_assembly_id: access.assemblyId,
    p_code: access.accessCode,
    p_publisher_id: publisherId,
  })
  if (error) throw new Error(`Impossible de charger les publications du proclamateur : ${error.message}`)
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
  const access = requireAssemblyAccess(assemblyId, accessCode)
  const { data, error } = await supabase.rpc('save_assembly_publisher_publication', {
    p_assembly_id: access.assemblyId,
    p_code: access.accessCode,
    p_publisher_id: publisherId,
    p_publication_id: publicationId,
    p_ordered_quantity: Math.max(0, Number(orderedQuantity) || 0),
    p_distributed_quantity: Math.max(0, Number(distributedQuantity) || 0),
  })
  if (error) throw new Error(`Impossible d’enregistrer la publication : ${error.message}`)
  const saved = Array.isArray(data) ? data[0] : data
  return saved ? mapPublisherPublication(saved) : null
}

export async function saveAllPublisherPublications(publisherId, publicationQuantities, assemblyId, accessCode) {
  const results = []
  for (const item of publicationQuantities) {
    const result = await savePublisherPublication({
      publisherId,
      publicationId: item.publicationId,
      orderedQuantity: item.orderedQuantity,
      distributedQuantity: item.distributedQuantity,
      assemblyId,
      accessCode,
    })
    if (result) results.push(result)
  }
  return results
}
