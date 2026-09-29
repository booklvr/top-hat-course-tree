import type { CourseItem } from "../shared/course-tree-contract.ts"

/**
 * Searches names case-insensitively and returns a flat, self-contained tree.
 *
 * Ancestors are included so every returned child still has its parent.
 * Descendants are included so a matching folder retains its contents. The
 * final filter preserves source order; presentation ordering remains a client
 * concern, as required by the original assignment.
 */
export function searchCourseTree(
  items: readonly CourseItem[],
  query: string,
): CourseItem[] {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return []

  const itemsById = new Map(items.map((item) => [item.id, item]))
  const childrenByParentId = new Map<number, CourseItem[]>()

  for (const item of items) {
    const children = childrenByParentId.get(item.parent_id)
    if (children) {
      children.push(item)
    } else {
      childrenByParentId.set(item.parent_id, [item])
    }
  }

  const matchingItems = items.filter((item) =>
    item.name.toLowerCase().includes(normalizedQuery),
  )
  if (matchingItems.length === 0) return []

  const includedIds = new Set<number>()

  // Walk toward the root for every match. The local set is defensive: bad
  // stored data should not turn an API request into an infinite loop. A node
  // already in includedIds has had its complete ancestor chain visited, so it
  // also prevents repeated walks when many matching nodes share ancestors.
  for (const match of matchingItems) {
    const visitedIds = new Set<number>()
    let current: CourseItem | undefined = match

    while (
      current &&
      !visitedIds.has(current.id) &&
      !includedIds.has(current.id)
    ) {
      visitedIds.add(current.id)
      includedIds.add(current.id)
      current =
        current.parent_id === 0
          ? undefined
          : itemsById.get(current.parent_id)
    }
  }

  // Use an explicit stack rather than recursion so a deeply nested valid tree
  // cannot overflow the JavaScript call stack.
  const expandedIds = new Set<number>()
  const pendingItems = [...matchingItems]

  while (pendingItems.length > 0) {
    const current = pendingItems.pop()
    if (!current || expandedIds.has(current.id)) continue

    expandedIds.add(current.id)
    includedIds.add(current.id)
    pendingItems.push(...(childrenByParentId.get(current.id) ?? []))
  }

  return items.filter((item) => includedIds.has(item.id))
}
