import { describe, expect, it } from "vitest"

import {
  filterCourseTreeByTerms,
  getSearchTerms,
} from "@/lib/course-tree-search-results"
import type { CourseItem } from "@/schemas/course-tree/courseTreeSchema"

const sampleItems: CourseItem[] = [
  { id: 5, name: "Chemical Kinetics", parent_id: 6 },
  { id: 3, name: "Surface Chemistry", parent_id: 1 },
  { id: 1, name: "Lab Experiment 1", parent_id: 0 },
  { id: 4, name: "Lab 1 Summary", parent_id: 1 },
  { id: 2, name: "Colloidal Solution of Starch", parent_id: 3 },
  { id: 6, name: "Lab Experiment 2", parent_id: 0 },
  { id: 7, name: "Colloidal Solution of Gum", parent_id: 3 },
]

const sampleItemsById = new Map(sampleItems.map((item) => [item.id, item]))

describe("getSearchTerms", () => {
  it("normalizes whitespace, casing, and duplicate terms", () => {
    expect(getSearchTerms("  La   EX\tla  1 ")).toEqual(["la", "ex", "1"])
  })

  it("returns no terms for a whitespace-only query", () => {
    expect(getSearchTerms("   \n ")).toEqual([])
  })
})

describe("filterCourseTreeByTerms", () => {
  it("requires every term in a direct match and retains its tree context", () => {
    expect(
      filterCourseTreeByTerms(sampleItemsById, [" LA ", "EX", "1"]).map(
        (item) => item.id,
      ),
    ).toEqual([3, 1, 4, 2, 7])
  })

  it("retains ancestors of a nested match without including its siblings", () => {
    expect(
      filterCourseTreeByTerms(sampleItemsById, ["colloidal", "starch"]).map(
        (item) => item.id,
      ),
    ).toEqual([3, 1, 2])
  })

  it("returns no items when no name contains every term", () => {
    expect(
      filterCourseTreeByTerms(sampleItemsById, ["lab", "starch"]),
    ).toEqual([])
  })

  it("includes shared context once when multiple items match", () => {
    const items: CourseItem[] = [
      { id: 10, name: "Course", parent_id: 0 },
      { id: 11, name: "Lab Experiment 1", parent_id: 10 },
      { id: 12, name: "First procedure", parent_id: 11 },
      { id: 13, name: "Lab Experiment 2", parent_id: 10 },
      { id: 14, name: "Second procedure", parent_id: 13 },
      { id: 15, name: "Unrelated course", parent_id: 0 },
    ]
    const itemsById = new Map(items.map((item) => [item.id, item]))

    expect(
      filterCourseTreeByTerms(itemsById, ["lab", "experiment"]).map(
        (item) => item.id,
      ),
    ).toEqual([10, 11, 12, 13, 14])
  })
})
