import { supabase } from '../lib/supabase'
import { DEFAULT_ASSEMBLY_ID } from './publicationService'

const mapPublisher = (publisher) => ({
  id: publisher.id,
  assemblyId: publisher.assembly_id,
  firstName: publisher.first_name,
  lastName: publisher.last_name,
  gender: publisher.gender ?? '',
  phone: publisher.phone ?? '',
  email: publisher.email ?? '',
  active: publisher.active ?? true,
  createdAt: publisher.created_at,
})

export async function getPublishers() {
  const { data, error } = await supabase
    .from('publishers')
    .select('*')
    .eq('assembly_id', DEFAULT_ASSEMBLY_ID)
    .eq('active', true)
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true })

  if (error) {
    throw new Error(
      `Impossible de charger les proclamateurs : ${error.message}`,
    )
  }

  return (data ?? []).map(mapPublisher)
}

export async function createPublisher(publisher) {
  const { data, error } = await supabase
    .from('publishers')
    .insert({
      assembly_id: DEFAULT_ASSEMBLY_ID,
      first_name: publisher.firstName.trim(),
      last_name: publisher.lastName.trim(),
      gender: publisher.gender || null,
      phone: publisher.phone?.trim() || null,
      email: publisher.email?.trim().toLowerCase() || null,
      active: true,
    })
    .select()
    .single()

  if (error) {
    throw new Error(
      `Impossible d’ajouter le proclamateur : ${error.message}`,
    )
  }

  return mapPublisher(data)
}

export async function updatePublisher(id, publisher) {
  const { data, error } = await supabase
    .from('publishers')
    .update({
      first_name: publisher.firstName.trim(),
      last_name: publisher.lastName.trim(),
      gender: publisher.gender || null,
      phone: publisher.phone?.trim() || null,
      email: publisher.email?.trim().toLowerCase() || null,
    })
    .eq('id', id)
    .eq('assembly_id', DEFAULT_ASSEMBLY_ID)
    .select()
    .single()

  if (error) {
    throw new Error(
      `Impossible de modifier le proclamateur : ${error.message}`,
    )
  }

  return mapPublisher(data)
}

export async function deletePublisher(id) {
  const { error } = await supabase
    .from('publishers')
    .update({ active: false })
    .eq('id', id)
    .eq('assembly_id', DEFAULT_ASSEMBLY_ID)

  if (error) {
    throw new Error(
      `Impossible de supprimer le proclamateur : ${error.message}`,
    )
  }
}