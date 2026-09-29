import { describe, expect, it } from "vitest"

import { courseTreeItems } from "../../server/course-tree-data.ts"
import { searchCourseTree } from "../../server/search-course-tree.ts"

function resultIds(query: string) {
  return searchCourseTree(courseTreeItems, query).map((item) => item.id)
}

describe("server searchCourseTree", () => {
  it("matches names case-insensitively", () => {
    expect(resultIds("cHeMiCaL kInEtIcS")).toEqual([5, 6])
  })

  it("includes ancestors and descendants needed for a complete subtree", () => {
    // Surface Chemistry matches directly. Lab Experiment 1 is its ancestor,
    // while both colloidal-solution items are descendants.
    expect(resultIds("Surface Chemistry")).toEqual([3, 1, 2, 7])
  })

  it("includes every descendant when a folder matches", () => {
    expect(resultIds("Lab Experiment 1")).toEqual([3, 1, 4, 2, 7])
  })

  it("preserves source order in the flat response", () => {
    expect(resultIds("Lab")).toEqual([5, 3, 1, 4, 2, 6, 7])
  })

  it("returns an empty list when nothing matches", () => {
    expect(resultIds("error")).toEqual([])
  })
})
