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

type ItemIndexResult = {
  itemsById: Map<number, CourseItem>
  issues: CourseTreeValidationIssue[]
}

function buildItemIndex(items: CourseItem[]): ItemIndexResult {
  const itemsById = new Map<number, CourseItem>()
  const issues: CourseTreeValidationIssue[] = []

  for (const item of items) {
    if (itemsById.has(item.id)) {
      issues.push({
        code: "duplicate-id",
        itemId: item.id,
        message: `Course item id ${item.id} is duplicated.`,
      })
      continue
    }

    itemsById.set(item.id, item)
  }

  return { itemsById, issues }
}

function getParentEdgeIssues(
  items: CourseItem[],
  itemsById: Map<number, CourseItem>,
): CourseTreeValidationIssue[] {
  const issues: CourseTreeValidationIssue[] = []

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

  return issues
}

function getCycleIssues(
  items: CourseItem[],
  itemsById: Map<number, CourseItem>,
): CourseTreeValidationIssue[] {
  const issues: CourseTreeValidationIssue[] = []
  const fullyCheckedIds = new Set<number>()

  for (const startingItem of items) {
    // This item's parent chain was completed during an earlier walk.
    if (fullyCheckedIds.has(startingItem.id)) continue

    const visitedIdsInThisWalk: number[] = []
    const visitIndexById = new Map<number, number>()
    let currentItem: CourseItem | undefined = startingItem

    while (
      currentItem &&
      currentItem.parent_id !== 0 &&
      !fullyCheckedIds.has(currentItem.id)
    ) {
      // Parent-edge validation already reports simple self-references.
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
      // A missing parent ends the walk; parent-edge validation reports it.
      currentItem = itemsById.get(currentItem.parent_id)
    }

    // Shared ancestors do not need to be walked again from later start items.
    for (const id of visitedIdsInThisWalk) fullyCheckedIds.add(id)
  }

  return issues
}

/**
 * Validates cross-item structure: duplicate ids, bad parent edges, and cycles.
 * Cycle detection walks parent_id upward in a loop (not recursion) so deep
 * valid trees cannot overflow the JavaScript call stack.
 */
export function getCourseTreeValidationIssues(
  items: CourseItem[],
): CourseTreeValidationIssue[] {
  const { itemsById, issues: duplicateIdIssues } = buildItemIndex(items)
  const parentEdgeIssues = getParentEdgeIssues(items, itemsById)
  const issues = [...duplicateIdIssues, ...parentEdgeIssues]

  // Duplicate ids make parent relationships ambiguous, so reporting those is
  // more useful than attempting cycle detection against an arbitrary duplicate.
  if (duplicateIdIssues.length > 0) return issues

  return [...issues, ...getCycleIssues(items, itemsById)]
}

export function assertValidCourseTree(items: CourseItem[]): void {
  const issues = getCourseTreeValidationIssues(items)
  if (issues.length > 0) {
    throw new InvalidCourseTreeError(issues)
  }
}
