import type { CourseItem } from "@/schemas/course-tree/courseTreeSchema"

/** Normalizes a user query into unique, case-insensitive substring terms. */
export function getSearchTerms(query: string): string[] {
  return [
    ...new Set(
      query
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean),
    ),
  ]
}

/**
 * Keeps items whose names contain every term, along with the ancestors and
 * descendants needed to display each match in its course-tree context.
 */
export function filterCourseTreeByTerms(
  itemsById: ReadonlyMap<number, CourseItem>,
  terms: string[],
): CourseItem[] {
  const normalizedTerms = [
    ...new Set(
      terms.map((term) => term.trim().toLowerCase()).filter(Boolean),
    ),
  ]
  if (normalizedTerms.length === 0) return []

  const items = [...itemsById.values()]
  const childrenByParentId = new Map<number, CourseItem[]>()

  for (const item of items) {
    const siblings = childrenByParentId.get(item.parent_id)
    if (siblings) {
      siblings.push(item)
    } else {
      childrenByParentId.set(item.parent_id, [item])
    }
  }

  const matchingIds = items
    .filter((item) => {
      const normalizedName = item.name.toLowerCase()
      return normalizedTerms.every((term) => normalizedName.includes(term))
    })
    .map((item) => item.id)

  if (matchingIds.length === 0) return []

  const includedIds = new Set<number>()
  const expandedAncestorIds = new Set<number>()

  function includeAncestors(itemId: number) {
    let current = itemsById.get(itemId)

    while (current && !expandedAncestorIds.has(current.id)) {
      expandedAncestorIds.add(current.id)
      includedIds.add(current.id)
      if (current.parent_id === 0) break
      current = itemsById.get(current.parent_id)
    }
  }

  const expandedIds = new Set<number>()
  function includeDescendants(parentId: number) {
    if (expandedIds.has(parentId)) return
    expandedIds.add(parentId)

    for (const child of childrenByParentId.get(parentId) ?? []) {
      includedIds.add(child.id)
      includeDescendants(child.id)
    }
  }

  for (const matchId of matchingIds) {
    includeAncestors(matchId)
    includeDescendants(matchId)
  }

  return items.filter((item) => includedIds.has(item.id))
}
