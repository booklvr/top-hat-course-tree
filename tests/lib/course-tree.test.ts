import { buildCourseTree, type CourseTreeNode } from "@/lib/course-tree"
import type { CourseItem } from "@/schemas/course-tree/courseTreeSchema"
import { describe, expect, it } from "vitest"

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
]

function ids(nodes: CourseTreeNode[]): Array<{
  id: number
  children: ReturnType<typeof ids>
}> {
  return nodes.map((node) => ({
    id: node.item.id,
    children: ids(node.children),
  }))
}

describe("buildCourseTree", () => {
  it("returns an empty array for empty input", () => {
    expect(buildCourseTree([])).toEqual([])
  })

  it("returns a single root", () => {
    const root = { id: 1, name: "Root", parent_id: 0 }

    expect(buildCourseTree([root])).toEqual([{ item: root, children: [] }])
  })

  it("returns multiple roots", () => {
    const items: CourseItem[] = [
      { id: 1, name: "First root", parent_id: 0 },
      { id: 2, name: "Second root", parent_id: 0 },
    ]

    expect(ids(buildCourseTree(items))).toEqual([
      { id: 1, children: [] },
      { id: 2, children: [] },
    ])
  })

  it("connects a child that appears before its parent", () => {
    const items: CourseItem[] = [
      { id: 2, name: "Child", parent_id: 1 },
      { id: 1, name: "Root", parent_id: 0 },
    ]

    expect(ids(buildCourseTree(items))).toEqual([
      { id: 1, children: [{ id: 2, children: [] }] },
    ])
  })

  it("builds nested descendants", () => {
    const items: CourseItem[] = [
      { id: 3, name: "Grandchild", parent_id: 2 },
      { id: 1, name: "Root", parent_id: 0 },
      { id: 2, name: "Child", parent_id: 1 },
    ]

    expect(ids(buildCourseTree(items))).toEqual([
      {
        id: 1,
        children: [
          { id: 2, children: [{ id: 3, children: [] }] },
        ],
      },
    ])
  })

  it("preserves root encounter order", () => {
    const items: CourseItem[] = [
      { id: 6, name: "Second numbered root", parent_id: 0 },
      { id: 1, name: "First numbered root", parent_id: 0 },
    ]

    expect(buildCourseTree(items).map((node) => node.item.id)).toEqual([6, 1])
  })

  it("preserves sibling encounter order", () => {
    const items: CourseItem[] = [
      { id: 4, name: "First encountered child", parent_id: 1 },
      { id: 1, name: "Root", parent_id: 0 },
      { id: 3, name: "Second encountered child", parent_id: 1 },
    ]

    expect(buildCourseTree(items)[0].children.map((node) => node.item.id)).toEqual([
      4, 3,
    ])
  })

  it("builds the assignment example exactly", () => {
    expect(buildCourseTree(sampleItems)).toEqual([
      {
        item: sampleItems[2],
        children: [
          {
            item: sampleItems[1],
            children: [
              { item: sampleItems[4], children: [] },
              { item: sampleItems[6], children: [] },
            ],
          },
          { item: sampleItems[3], children: [] },
        ],
      },
      {
        item: sampleItems[5],
        children: [{ item: sampleItems[0], children: [] }],
      },
    ])
  })
})
