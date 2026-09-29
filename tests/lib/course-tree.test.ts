import { flattenCourseTree, getVisibleCourseTreeRows } from "@/lib/course-tree";
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

describe("getVisibleCourseTreeRows", () => {
  const rows = flattenCourseTree(sampleItems);

  it("shows every row by default and identifies parents", () => {
    const visibleRows = getVisibleCourseTreeRows(rows, new Set());

    expect(visibleRows.map(({ item, hasChildren }) => [item.id, hasChildren])).toEqual([
      [1, true],
      [3, true],
      [2, false],
      [7, false],
      [4, false],
      [6, true],
      [5, false],
    ]);
  });

  it("hides all descendants of a collapsed root but keeps later roots", () => {
    const visibleRows = getVisibleCourseTreeRows(rows, new Set([1]));

    expect(visibleRows.map(({ item }) => item.id)).toEqual([1, 6, 5]);
  });

  it("hides nested descendants while preserving their parent's siblings", () => {
    const visibleRows = getVisibleCourseTreeRows(rows, new Set([3]));

    expect(visibleRows.map(({ item }) => item.id)).toEqual([1, 3, 4, 6, 5]);
  });

  it("preserves nested collapsed state while an ancestor is collapsed", () => {
    const collapsedIds = new Set([1, 3]);

    expect(
      getVisibleCourseTreeRows(rows, collapsedIds).map(({ item }) => item.id),
    ).toEqual([1, 6, 5]);

    collapsedIds.delete(1);
    expect(
      getVisibleCourseTreeRows(rows, collapsedIds).map(({ item }) => item.id),
    ).toEqual([1, 3, 4, 6, 5]);
  });
});
