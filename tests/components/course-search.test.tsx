// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { searchCourseTree } from "@/api/course-tree-search"
import { CourseSearch } from "@/components/course-search"
import { SEARCH_ERROR_MESSAGE } from "@/lib/search-course-tree"

vi.mock("@/api/course-tree-search", () => ({
  searchCourseTree: vi.fn(),
}))

const searchCourseTreeMock = vi.mocked(searchCourseTree)

const hierarchyItems = [
  { id: 4, name: "Grandchild", parent_id: 2 },
  { id: 2, name: "First child", parent_id: 1 },
  { id: 1, name: "First root", parent_id: 0 },
  { id: 3, name: "Second child", parent_id: 1 },
  { id: 5, name: "Second root", parent_id: 0 },
  { id: 6, name: "Other branch child", parent_id: 5 },
]

async function submitSearch(query: string) {
  const user = userEvent.setup()
  await user.type(screen.getByRole("textbox", { name: "Search" }), query)
  await user.click(screen.getByRole("button", { name: "Search" }))
  return user
}

describe("CourseSearch", () => {
  afterEach(() => {
    cleanup()
    vi.resetAllMocks()
  })

  it("renders the indented hierarchy returned by a successful search", async () => {
    searchCourseTreeMock.mockResolvedValue(hierarchyItems)

    render(<CourseSearch />)
    await submitSearch("Lab")

    await screen.findByText("First root")
    const labels = screen.getAllByRole("listitem").map(
      (item) => item.querySelector("span")?.textContent,
    )

    expect(labels).toEqual([
      "First root",
      "- First child",
      "- - Grandchild",
      "- Second child",
      "Second root",
      "- Other branch child",
    ])
  })

  it("collapses and expands a parent subtree", async () => {
    searchCourseTreeMock.mockResolvedValue(hierarchyItems)

    render(<CourseSearch />)
    const user = await submitSearch("Lab")

    const collapseButton = await screen.findByRole("button", {
      name: "Collapse First child",
    })
    expect(collapseButton.getAttribute("aria-expanded")).toBe("true")

    await user.click(collapseButton)
    expect(screen.queryByText("- - Grandchild")).toBeNull()

    const expandButton = screen.getByRole("button", {
      name: "Expand First child",
    })
    expect(expandButton.getAttribute("aria-expanded")).toBe("false")

    await user.click(expandButton)
    expect(screen.getByText("- - Grandchild")).toBeTruthy()
  })

  it("keeps unrelated siblings and subtrees visible when one branch collapses", async () => {
    searchCourseTreeMock.mockResolvedValue(hierarchyItems)

    render(<CourseSearch />)
    const user = await submitSearch("Lab")

    await user.click(
      await screen.findByRole("button", { name: "Collapse First root" }),
    )

    expect(screen.queryByText("- First child")).toBeNull()
    expect(screen.queryByText("- Second child")).toBeNull()
    expect(screen.getByText("Second root")).toBeTruthy()
    expect(screen.getByText("- Other branch child")).toBeTruthy()
  })

  it("does not render expand controls for leaf nodes", async () => {
    searchCourseTreeMock.mockResolvedValue(hierarchyItems)

    render(<CourseSearch />)
    await submitSearch("Lab")

    await screen.findByText("- - Grandchild")
    expect(
      screen.queryByRole("button", { name: /Grandchild/ }),
    ).toBeNull()
    expect(
      screen.queryByRole("button", { name: /Second child/ }),
    ).toBeNull()
  })

  it("shows an empty state for a successful search with no items", async () => {
    searchCourseTreeMock.mockResolvedValue([])

    render(<CourseSearch />)
    await submitSearch("error")

    expect(await screen.findByText("No course items found.")).toBeTruthy()
  })

  it("shows a retry message when the search fails", async () => {
    searchCourseTreeMock.mockRejectedValue(new Error("Network failure"))

    render(<CourseSearch />)
    await submitSearch("Lab")

    expect(await screen.findByText(SEARCH_ERROR_MESSAGE)).toBeTruthy()
  })

  it("disables the form while a search is in flight", async () => {
    let resolveSearch: (items: []) => void
    searchCourseTreeMock.mockReturnValue(
      new Promise((resolve) => {
        resolveSearch = resolve
      }),
    )

    render(<CourseSearch />)
    await submitSearch("Lab")

    const input = screen.getByRole("textbox", { name: "Search" })
    const button = screen.getByRole("button", { name: "Search" })
    expect(input.getAttribute("disabled")).not.toBeNull()
    expect(button.getAttribute("disabled")).not.toBeNull()

    resolveSearch!([])
    expect(await screen.findByText("No course items found.")).toBeTruthy()
  })
})
