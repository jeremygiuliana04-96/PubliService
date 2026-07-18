import { getPublisherPublications } from './publisherPublicationService'

const getAssemblyId = (assembly) =>
  assembly?.id ??
  assembly?.assemblyId ??
  assembly?.assembly_id

const getAccessCode = (assembly) =>
  assembly?.accessCode ??
  assembly?.access_code ??
  assembly?.code

export async function getStockOverview({
  publishers = [],
  publications = [],
  currentAssembly = null,
}) {
  const assemblyId = getAssemblyId(currentAssembly)
  const accessCode = getAccessCode(currentAssembly)

  if (!assemblyId || !accessCode) {
    throw new Error(
      'Les informations de l’assemblée sont introuvables.',
    )
  }

  const publisherRows = await Promise.all(
    publishers.map((publisher) =>
      getPublisherPublications(
        publisher.id,
        assemblyId,
        accessCode,
      ),
    ),
  )

  const remainingByPublication = new Map()

  publisherRows.flat().forEach((row) => {
    const ordered = Math.max(
      0,
      Number(row.orderedQuantity ?? 0),
    )
    const distributed = Math.max(
      0,
      Number(row.distributedQuantity ?? 0),
    )
    const remaining = Math.max(0, ordered - distributed)
    const key = String(row.publicationId)

    remainingByPublication.set(
      key,
      (remainingByPublication.get(key) ?? 0) + remaining,
    )
  })

  return publications.map((publication) => {
    const stock = Math.max(0, Number(publication.stock ?? 0))
    const toDistribute =
      remainingByPublication.get(String(publication.id)) ?? 0
    const stockAfterDistribution = stock - toDistribute
    const minimum = Math.max(
      0,
      Number(publication.minimum ?? 5),
    )

    let status = 'sufficient'

    if (stockAfterDistribution < 0) {
      status = 'insufficient'
    } else if (stockAfterDistribution <= minimum) {
      status = 'low'
    }

    return {
      publicationId: publication.id,
      publicationName: publication.name,
      stock,
      toDistribute,
      stockAfterDistribution,
      missingQuantity: Math.max(
        0,
        Math.abs(stockAfterDistribution),
      ),
      status,
    }
  })
}
