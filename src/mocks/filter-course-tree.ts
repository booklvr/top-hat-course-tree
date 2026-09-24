import type { CourseItem } from "@/schemas/course-tree/courseTreeSchema"

/**
 * Returns items whose names match the query, plus ancestors and descendants
 * needed to preserve a valid hierarchy for flattenCourseTree.
 */
export function filterCourseTreeByQuery(
  items: CourseItem[],
  query: string,
): CourseItem[] {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return []
  }

  const itemsById = new Map(items.map((item) => [item.id, item]))
  const childrenByParentId = new Map<number, CourseItem[]>()

  for (const item of items) {
    const siblings = childrenByParentId.get(item.parent_id)
    if (siblings) {
      siblings.push(item)
    } else {
      childrenByParentId.set(item.parent_id, [item])
    }
  }

  const matchingIds = new Set(
    items
      .filter((item) => item.name.toLowerCase().includes(normalizedQuery))
      .map((item) => item.id),
  )

  if (matchingIds.size === 0) {
    return []
  }

  const includedIds = new Set<number>()

  function includeAncestors(itemId: number) {
    let current = itemsById.get(itemId)
    while (current) {
      includedIds.add(current.id)
      if (current.parent_id === 0) {
        break
      }
      current = itemsById.get(current.parent_id)
    }
  }

  function includeDescendants(parentId: number) {
    const children = childrenByParentId.get(parentId)
    if (!children) return

    for (const child of children) {
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
