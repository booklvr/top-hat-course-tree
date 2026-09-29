import { beforeEach, describe, expect, it, vi } from "vitest"

import { searchCourseTree } from "@/api/course-tree-search"
import type { CourseItem } from "@/schemas/course-tree/courseTreeSchema"

const searchLiveCourseTreeMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib/search-course-tree", () => ({
  searchCourseTree: searchLiveCourseTreeMock,
}))

const labOneTree: CourseItem[] = [
  { id: 1, name: "Lab Experiment 1", parent_id: 0 },
  { id: 2, name: "Surface Chemistry", parent_id: 1 },
]

const labTwoTree: CourseItem[] = [
  { id: 3, name: "Lab Experiment 2", parent_id: 0 },
  { id: 4, name: "Chemical Kinetics", parent_id: 3 },
]

describe("searchCourseTree", () => {
  beforeEach(() => {
    searchLiveCourseTreeMock.mockReset()
  })

  it("searches unique terms, merges by ID, and returns matching tree context", async () => {
    searchLiveCourseTreeMock.mockImplementation(async (term: string) => {
      if (term === "1") return labOneTree
      return [...labOneTree, ...labTwoTree]
    })

    await expect(searchCourseTree(" La  EX la 1 ")).resolves.toEqual(labOneTree)

    expect(searchLiveCourseTreeMock).toHaveBeenCalledTimes(3)
    expect(searchLiveCourseTreeMock).toHaveBeenNthCalledWith(1, "la")
    expect(searchLiveCourseTreeMock).toHaveBeenNthCalledWith(2, "ex")
    expect(searchLiveCourseTreeMock).toHaveBeenNthCalledWith(3, "1")
  })

  it("preserves the existing single-term search behavior", async () => {
    searchLiveCourseTreeMock.mockResolvedValue(labOneTree)

    await expect(searchCourseTree("Lab")).resolves.toEqual(labOneTree)
    expect(searchLiveCourseTreeMock).toHaveBeenCalledOnce()
    expect(searchLiveCourseTreeMock).toHaveBeenCalledWith("lab")
  })

  it("starts all term searches before waiting for their responses", async () => {
    const resolvers: Array<(items: CourseItem[]) => void> = []
    searchLiveCourseTreeMock.mockImplementation(
      () =>
        new Promise<CourseItem[]>((resolve) => {
          resolvers.push(resolve)
        }),
    )

    const searchPromise = searchCourseTree("la ex 1")
    expect(searchLiveCourseTreeMock).toHaveBeenCalledTimes(3)

    for (const resolve of resolvers) resolve([])
    await expect(searchPromise).resolves.toEqual([])
  })

  it("rejects the search when any required server request fails", async () => {
    const failure = new Error("Network failure")
    searchLiveCourseTreeMock.mockImplementation(async (term: string) => {
      if (term === "ex") throw failure
      return labOneTree
    })

    await expect(searchCourseTree("la ex 1")).rejects.toBe(failure)
  })

  it("does not call the server for an empty query", async () => {
    await expect(searchCourseTree("   ")).resolves.toEqual([])
    expect(searchLiveCourseTreeMock).not.toHaveBeenCalled()
  })
})
