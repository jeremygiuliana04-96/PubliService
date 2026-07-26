import { distributeAllRemaining } from '../services/distributionService'
import {
  listOfflineOperations,
  removeOfflineOperation,
} from './queue'

async function executeOperation(operation, accessCodes) {
  if (operation.type === 'distribution.allRemaining') {
    const currentAccessCode =
      accessCodes?.[String(operation.assemblyId)] ??
      operation.accessCode

    return distributeAllRemaining({
      assemblyId: operation.assemblyId,
      accessCode: currentAccessCode,
      publisherId: operation.publisherId,
      publicationId: operation.publicationId,
    })
  }

  throw new Error(
    `Opération hors ligne inconnue : ${operation.type}`,
  )
}

export async function syncOfflineOperations({
  assemblyId = null,
  accessCodes = null,
  onProgress = null,
} = {}) {
  const operations = await listOfflineOperations(assemblyId)
  const completed = []
  const failed = []

  if (
    typeof navigator !== 'undefined' &&
    !navigator.onLine
  ) {
    return {
      completed,
      failed: operations,
      remaining: operations.length,
      offline: true,
    }
  }

  for (const operation of operations) {
    try {
      await executeOperation(operation, accessCodes)
      await removeOfflineOperation(operation.id)
      completed.push(operation)
    } catch (error) {
      failed.push({
        ...operation,
        error:
          error?.message ??
          'La synchronisation a échoué.',
      })

      if (
        typeof navigator !== 'undefined' &&
        !navigator.onLine
      ) {
        break
      }
    }

    onProgress?.({
      completed: completed.length,
      failed: failed.length,
      total: operations.length,
    })
  }

  const remaining = await listOfflineOperations(assemblyId)

  return {
    completed,
    failed,
    remaining: remaining.length,
    offline: false,
  }
}
