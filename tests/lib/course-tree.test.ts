import { flattenCourseTree } from "@/lib/course-tree";
import type { CourseTreeRow } from "@/lib/course-tree"
import type { CourseItem } from "@/schemas/course-tree/courseTreeSchema"
import { describe, expect, it } from "vitest";

const sampleItems: CourseItem[] = [
  { id: 5, name: "Chemical Kinetics", parent_id: 6 },
  { id: 3, name: "Surface Chemistry", parent_id: 1 },
  { id: 1, name: "Lab Experiment 1", parent_id: 0 },
  { id: 4, name: "Lab 1 Summary", parent_id: 1 },
  {
    id: 2,
    name: "Colloidal Solution (sol) of Starch",
    parent_id: 3,
  },
  { id: 6, name: "Lab Experiment 2", parent_id: 0 },
  { id: 7, name: "Colloidal Solution of Gum", parent_id: 3 },
];

function outline(rows: CourseTreeRow[]) {
  return rows.map(({ item, depth }) => ({
    id: item.id,
    name: item.name,
    depth,
  }));
}

describe("flattenCourseTree", () => {
  it("places each subtree immediately after its parent at the correct depth", () => {
    expect(outline(flattenCourseTree(sampleItems))).toEqual([
      { id: 1, name: "Lab Experiment 1", depth: 0 },
      { id: 3, name: "Surface Chemistry", depth: 1 },
      { id: 2, name: "Colloidal Solution (sol) of Starch", depth: 2 },
      { id: 7, name: "Colloidal Solution of Gum", depth: 2 },
      { id: 4, name: "Lab 1 Summary", depth: 1 },
      { id: 6, name: "Lab Experiment 2", depth: 0 },
      { id: 5, name: "Chemical Kinetics", depth: 1 },
    ]);
  });

  it("returns an empty array for an empty input", () => {
    expect(flattenCourseTree([])).toEqual([]);
  });

  it("returns a single root at depth 0", () => {
    const items: CourseItem[] = [
      { id: 1, name: "Lab Experiment 1", parent_id: 0 },
    ];

    expect(outline(flattenCourseTree(items))).toEqual([
      { id: 1, name: "Lab Experiment 1", depth: 0 },
    ]);
  });

  it("preserves the original input order of multiple roots", () => {
    const items: CourseItem[] = [
      { id: 6, name: "Lab Experiment 2", parent_id: 0 },
      { id: 1, name: "Lab Experiment 1", parent_id: 0 },
    ];

    expect(outline(flattenCourseTree(items))).toEqual([
      { id: 6, name: "Lab Experiment 2", depth: 0 },
      { id: 1, name: "Lab Experiment 1", depth: 0 },
    ]);
  });

  it("preserves the original input order of siblings", () => {
    const items: CourseItem[] = [
      { id: 1, name: "Lab Experiment 1", parent_id: 0 },
      { id: 4, name: "Lab 1 Summary", parent_id: 1 },
      { id: 3, name: "Surface Chemistry", parent_id: 1 },
    ];

    expect(outline(flattenCourseTree(items))).toEqual([
      { id: 1, name: "Lab Experiment 1", depth: 0 },
      { id: 4, name: "Lab 1 Summary", depth: 1 },
      { id: 3, name: "Surface Chemistry", depth: 1 },
    ]);
  });

  it("calculates depth for nesting deeper than the sample", () => {
    const items: CourseItem[] = [
      { id: 4, name: "Procedure", parent_id: 3 },
      { id: 2, name: "Surface Chemistry", parent_id: 1 },
      { id: 1, name: "Lab Experiment 1", parent_id: 0 },
      { id: 3, name: "Colloidal Solution of Starch", parent_id: 2 },
    ];

    expect(outline(flattenCourseTree(items))).toEqual([
      { id: 1, name: "Lab Experiment 1", depth: 0 },
      { id: 2, name: "Surface Chemistry", depth: 1 },
      { id: 3, name: "Colloidal Solution of Starch", depth: 2 },
      { id: 4, name: "Procedure", depth: 3 },
    ]);
  });
});
