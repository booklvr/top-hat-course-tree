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

    expect(issueCodes(items)).toContain("duplicate-id")
  })

  it("rejects a reference to a missing parent", () => {
    const items: CourseItem[] = [
      { id: 1, name: "Orphan", parent_id: 99 },
    ]

    expect(issueCodes(items)).toContain("missing-parent")
  })

  it("rejects self-references", () => {
    const items: CourseItem[] = [
      { id: 1, name: "Self", parent_id: 1 },
    ]

    expect(issueCodes(items)).toContain("self-reference")
  })

  it("rejects cycles that are not connected to a root", () => {
    const items: CourseItem[] = [
      { id: 1, name: "First", parent_id: 2 },
      { id: 2, name: "Second", parent_id: 1 },
    ]

    expect(issueCodes(items)).toContain("cycle")
    expect(() => assertValidCourseTree(items)).toThrow(InvalidCourseTreeError)
  })
})
