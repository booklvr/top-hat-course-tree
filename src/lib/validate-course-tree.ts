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
 * Checks the relationships that cannot be validated one item at a time.
 * The walk is iterative so malformed or unusually deep input cannot overflow
 * the JavaScript call stack.
 */
export function getCourseTreeValidationIssues(
  items: CourseItem[],
): CourseTreeValidationIssue[] {
  const issues: CourseTreeValidationIssue[] = []
  const itemsById = new Map<number, CourseItem>()
  let hasDuplicateIds = false

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

  const resolvedIds = new Set<number>()

  for (const item of items) {
    if (resolvedIds.has(item.id)) continue

    const path: number[] = []
    const pathIndexes = new Map<number, number>()
    let current: CourseItem | undefined = item

    while (current && current.parent_id !== 0 && !resolvedIds.has(current.id)) {
      if (current.parent_id === current.id) break

      const cycleStartIndex = pathIndexes.get(current.id)
      if (cycleStartIndex !== undefined) {
        const cycleIds = path.slice(cycleStartIndex)
        issues.push({
          code: "cycle",
          itemId: current.id,
          message: `Course tree contains a cycle involving ids ${cycleIds.join(", ")}.`,
        })
        break
      }

      pathIndexes.set(current.id, path.length)
      path.push(current.id)
      current = itemsById.get(current.parent_id)
    }

    for (const id of path) resolvedIds.add(id)
  }

  return issues
}

export function assertValidCourseTree(items: CourseItem[]): void {
  const issues = getCourseTreeValidationIssues(items)
  if (issues.length > 0) {
    throw new InvalidCourseTreeError(issues)
  }
}
