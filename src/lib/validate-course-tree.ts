import type { CourseItem } from "@/schemas/course-tree/courseTreeSchema"

export type CourseTreeValidationIssueCode =
  | "duplicate-id"
  | "missing-parent"
  | "self-reference"
  | "cycle"

export type CourseTreeValidationIssue = {
  code: CourseTreeValidationIssueCode
  itemId: number
  message: string
}

export class InvalidCourseTreeError extends Error {
  readonly issues: CourseTreeValidationIssue[]

  constructor(issues: CourseTreeValidationIssue[]) {
    super("Invalid course tree")
    this.name = "InvalidCourseTreeError"
    this.issues = issues
  }
}

/**
 * Validates cross-item structure: duplicate ids, bad parent edges, and cycles.
 * Cycle detection walks parent_id upward in a loop (not recursion) so deep
 * valid trees cannot overflow the JavaScript call stack.
 */
export function getCourseTreeValidationIssues(
  items: CourseItem[],
): CourseTreeValidationIssue[] {
  const issues: CourseTreeValidationIssue[] = []
  const itemsById = new Map<number, CourseItem>()
  let hasDuplicateIds = false

  // Pass 1: unique ids (needed for parent lookups in later passes).
  for (const item of items) {
    if (itemsById.has(item.id)) {
      hasDuplicateIds = true
      issues.push({
        code: "duplicate-id",
        itemId: item.id,
        message: `Course item id ${item.id} is duplicated.`,
      })
      continue
    }

    itemsById.set(item.id, item)
  }

  // Pass 2: per-item parent edges (self-reference, dangling parent_id).
  for (const item of items) {
    if (item.parent_id === item.id) {
      issues.push({
        code: "self-reference",
        itemId: item.id,
        message: `Course item ${item.id} cannot be its own parent.`,
      })
    } else if (item.parent_id !== 0 && !itemsById.has(item.parent_id)) {
      issues.push({
        code: "missing-parent",
        itemId: item.id,
        message: `Course item ${item.id} references missing parent ${item.parent_id}.`,
      })
    }
  }

  // Duplicate ids make parent relationships ambiguous, so reporting those is
  // more useful than attempting cycle detection against an arbitrary duplicate.
  if (hasDuplicateIds) return issues

  // Pass 3: cycles in the parent_id graph. Each item has one parent, so following
  // parent_id upward from any node is a single chain. A cycle is when that chain
  // never reaches parent_id === 0 and revisits a node (e.g. 1 → 2 → 1).
  const fullyCheckedIds = new Set<number>()

  for (const startingItem of items) {
    // This id was already on a finished upward walk (same parent chain as an earlier
    // start item), so cycle detection for that chain is done — skip to the next row.
    if (fullyCheckedIds.has(startingItem.id)) continue

    // The array preserves visit order; the map tells us whether and where an id
    // already appeared during this particular walk.
    const visitedIdsInThisWalk: number[] = []
    const visitIndexById = new Map<number, number>()
    let currentItem: CourseItem | undefined = startingItem

    while (
      currentItem &&
      currentItem.parent_id !== 0 &&
      !fullyCheckedIds.has(currentItem.id)
    ) {
      // Self-reference was reported in pass 2; stop without emitting a cycle issue.
      if (currentItem.parent_id === currentItem.id) break

      const cycleStartIndex = visitIndexById.get(currentItem.id)
      if (cycleStartIndex !== undefined) {
        const cycleIds = visitedIdsInThisWalk.slice(cycleStartIndex)
        issues.push({
          code: "cycle",
          itemId: currentItem.id,
          message: `Course tree contains a cycle involving ids ${cycleIds.join(", ")}.`,
        })
        break
      }

      visitIndexById.set(currentItem.id, visitedIdsInThisWalk.length)
      visitedIdsInThisWalk.push(currentItem.id)
      // Missing parent ends the walk (already reported in pass 2) when get returns undefined.
      currentItem = itemsById.get(currentItem.parent_id)
    }

    // Skip re-walking these ids when another array element shares the same chain.
    for (const id of visitedIdsInThisWalk) fullyCheckedIds.add(id)
  }

  return issues
}

export function assertValidCourseTree(items: CourseItem[]): void {
  const issues = getCourseTreeValidationIssues(items)
  if (issues.length > 0) {
    throw new InvalidCourseTreeError(issues)
  }
}
