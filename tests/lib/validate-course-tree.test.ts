import { describe, expect, it } from "vitest"

import {
  assertValidCourseTree,
  getCourseTreeValidationIssues,
  InvalidCourseTreeError,
} from "@/lib/validate-course-tree"
import type { CourseItem } from "@/schemas/course-tree/courseTreeSchema"

function issueCodes(items: CourseItem[]) {
  return getCourseTreeValidationIssues(items).map((issue) => issue.code)
}

describe("course tree validation", () => {
  it("accepts an empty tree", () => {
    expect(getCourseTreeValidationIssues([])).toEqual([])
  })

  it("accepts a single root", () => {
    const items: CourseItem[] = [{ id: 1, name: "Root", parent_id: 0 }]

    expect(getCourseTreeValidationIssues(items)).toEqual([])
  })

  it("accepts multiple roots", () => {
    const items: CourseItem[] = [
      { id: 1, name: "First root", parent_id: 0 },
      { id: 2, name: "Second root", parent_id: 0 },
    ]

    expect(getCourseTreeValidationIssues(items)).toEqual([])
  })

  it("accepts a valid tree regardless of input order", () => {
    const items: CourseItem[] = [
      { id: 3, name: "Grandchild", parent_id: 2 },
      { id: 1, name: "Root", parent_id: 0 },
      { id: 2, name: "Child", parent_id: 1 },
    ]

    expect(getCourseTreeValidationIssues(items)).toEqual([])
    expect(() => assertValidCourseTree(items)).not.toThrow()
  })

  it("rejects duplicate ids", () => {
    const items: CourseItem[] = [
      { id: 1, name: "First", parent_id: 0 },
      { id: 1, name: "Second", parent_id: 0 },
    ]

    expect(getCourseTreeValidationIssues(items)).toContainEqual(
      expect.objectContaining({ code: "duplicate-id", itemId: 1 }),
    )
  })

  it("does not attempt cycle detection when ids are duplicated", () => {
    const items: CourseItem[] = [
      { id: 1, name: "First", parent_id: 2 },
      { id: 1, name: "Duplicate", parent_id: 0 },
      { id: 2, name: "Second", parent_id: 1 },
    ]

    expect(issueCodes(items)).toEqual(["duplicate-id"])
  })

  it("rejects a reference to a missing parent", () => {
    const items: CourseItem[] = [
      { id: 1, name: "Orphan", parent_id: 99 },
    ]

    expect(getCourseTreeValidationIssues(items)).toContainEqual(
      expect.objectContaining({ code: "missing-parent", itemId: 1 }),
    )
  })

  it("rejects self-references", () => {
    const items: CourseItem[] = [
      { id: 1, name: "Self", parent_id: 1 },
    ]

    const issues = getCourseTreeValidationIssues(items)

    expect(issues).toContainEqual(
      expect.objectContaining({ code: "self-reference", itemId: 1 }),
    )
    expect(issues).not.toContainEqual(expect.objectContaining({ code: "cycle" }))
  })

  it("rejects a two-node cycle", () => {
    const items: CourseItem[] = [
      { id: 1, name: "First", parent_id: 2 },
      { id: 2, name: "Second", parent_id: 1 },
    ]

    expect(getCourseTreeValidationIssues(items)).toContainEqual(
      expect.objectContaining({ code: "cycle", itemId: 1 }),
    )
    expect(() => assertValidCourseTree(items)).toThrow(InvalidCourseTreeError)
  })

  it("reports every id in a longer cycle", () => {
    const items: CourseItem[] = [
      { id: 1, name: "First", parent_id: 2 },
      { id: 2, name: "Second", parent_id: 3 },
      { id: 3, name: "Third", parent_id: 1 },
    ]

    expect(getCourseTreeValidationIssues(items)).toContainEqual({
      code: "cycle",
      itemId: 1,
      message: "Course tree contains a cycle involving ids 1, 2, 3.",
    })
  })

  it("rejects a disconnected cycle alongside a valid rooted subtree", () => {
    const items: CourseItem[] = [
      { id: 1, name: "Root", parent_id: 0 },
      { id: 2, name: "Child", parent_id: 1 },
      { id: 5, name: "Cycle A", parent_id: 6 },
      { id: 6, name: "Cycle B", parent_id: 5 },
    ]

    expect(getCourseTreeValidationIssues(items)).toContainEqual(
      expect.objectContaining({ code: "cycle", itemId: 5 }),
    )
  })

  it("accepts branches that share an already-validated ancestor chain", () => {
    const items: CourseItem[] = [
      { id: 4, name: "First leaf", parent_id: 2 },
      { id: 5, name: "Second leaf", parent_id: 2 },
      { id: 2, name: "Shared parent", parent_id: 1 },
      { id: 1, name: "Root", parent_id: 0 },
    ]

    expect(getCourseTreeValidationIssues(items)).toEqual([])
  })
})
