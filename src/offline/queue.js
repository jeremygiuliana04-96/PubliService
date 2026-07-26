import { get, set } from 'idb-keyval'

const QUEUE_VERSION = 1
const QUEUE_KEY = `publiservice-offline-queue:v${QUEUE_VERSION}`
export const OFFLINE_QUEUE_CHANGED_EVENT =
  'publiservice:offline-queue-changed'

function createOperationId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }

  return `offline-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`
}

function notifyQueueChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(OFFLINE_QUEUE_CHANGED_EVENT),
    )
  }
}

function operationKey(operation) {
  return [
    operation.type,
    operation.assemblyId,
    operation.publisherId,
    operation.publicationId,
  ].join(':')
}

async function readQueue() {
  const stored = await get(QUEUE_KEY)

  if (!Array.isArray(stored)) return []

  return stored.filter(
    (operation) =>
      operation?.id &&
      operation?.type &&
      operation?.assemblyId,
  )
}

async function writeQueue(operations) {
  await set(QUEUE_KEY, operations)
  notifyQueueChanged()

  return operations
}

export async function listOfflineOperations(assemblyId = null) {
  const operations = await readQueue()

  if (!assemblyId) return operations

  return operations.filter(
    (operation) =>
      String(operation.assemblyId) === String(assemblyId),
  )
}

export async function countOfflineOperations(assemblyId = null) {
  const operations = await listOfflineOperations(assemblyId)

  return operations.length
}

export async function enqueueDistributionOperation({
  assemblyId,
  accessCode,
  publisherId,
  publicationId,
  quantity,
  publicationName = '',
  publisherName = '',
}) {
  if (!assemblyId || !publisherId || !publicationId) {
    throw new Error(
      'La distribution hors ligne est incomplète.',
    )
  }

  const cleanCode = String(accessCode ?? '').replace(/\D/g, '')

  if (cleanCode.length !== 6) {
    throw new Error(
      'Le code de l’assemblée est introuvable.',
    )
  }

  const operations = await readQueue()
  const operation = {
    id: createOperationId(),
    type: 'distribution.allRemaining',
    assemblyId: String(assemblyId),
    accessCode: cleanCode,
    publisherId: String(publisherId),
    publicationId: String(publicationId),
    quantity: Math.max(0, Number(quantity) || 0),
    publicationName,
    publisherName,
    createdAt: new Date().toISOString(),
  }
  const key = operationKey(operation)
  const existing = operations.find(
    (item) => operationKey(item) === key,
  )

  if (existing) {
    return {
      operation: existing,
      added: false,
    }
  }

  await writeQueue([...operations, operation])

  return {
    operation,
    added: true,
  }
}

export async function removeOfflineOperation(operationId) {
  const operations = await readQueue()
  const nextOperations = operations.filter(
    (operation) => operation.id !== operationId,
  )

  if (nextOperations.length !== operations.length) {
    await writeQueue(nextOperations)
  }

  return nextOperations
}
