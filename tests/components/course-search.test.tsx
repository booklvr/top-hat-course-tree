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
    searchCourseTreeMock.mockResolvedValue([
      { id: 2, name: "Surface Chemistry", parent_id: 1 },
      { id: 1, name: "Lab Experiment 1", parent_id: 0 },
    ])

    render(<CourseSearch />)
    await submitSearch("Lab")

    expect(await screen.findByText("Lab Experiment 1")).toBeTruthy()
    expect(screen.getByText("- Surface Chemistry")).toBeTruthy()
  })

  it("collapses and expands descendants without hiding later roots", async () => {
    searchCourseTreeMock.mockResolvedValue([
      { id: 3, name: "Deep topic", parent_id: 2 },
      { id: 2, name: "Surface Chemistry", parent_id: 1 },
      { id: 1, name: "Lab Experiment 1", parent_id: 0 },
      { id: 4, name: "Lab Experiment 2", parent_id: 0 },
    ])

    render(<CourseSearch />)
    const user = await submitSearch("Lab")

    const toggle = await screen.findByRole("button", {
      name: "Collapse Lab Experiment 1",
    })
    expect(toggle.getAttribute("aria-expanded")).toBe("true")

    await user.click(toggle)

    expect(screen.queryByText("- Surface Chemistry")).toBeNull()
    expect(screen.queryByText("- - Deep topic")).toBeNull()
    expect(screen.getByText("Lab Experiment 2")).toBeTruthy()

    const expandToggle = screen.getByRole("button", {
      name: "Expand Lab Experiment 1",
    })
    expect(expandToggle.getAttribute("aria-expanded")).toBe("false")
    await user.click(expandToggle)

    expect(screen.getByText("- Surface Chemistry")).toBeTruthy()
    expect(screen.getByText("- - Deep topic")).toBeTruthy()
  })

  it("renders leaves as text without unnecessary disclosure buttons", async () => {
    searchCourseTreeMock.mockResolvedValue([
      { id: 1, name: "Leaf item", parent_id: 0 },
    ])

    render(<CourseSearch />)
    await submitSearch("Leaf")

    expect(await screen.findByText("Leaf item")).toBeTruthy()
    expect(
      screen.queryByRole("button", { name: /Leaf item/ }),
    ).toBeNull()
  })

  it("resets collapsed state when a new search starts", async () => {
    searchCourseTreeMock
      .mockResolvedValueOnce([
        { id: 2, name: "First child", parent_id: 1 },
        { id: 1, name: "Shared root", parent_id: 0 },
      ])
      .mockResolvedValueOnce([
        { id: 3, name: "New child", parent_id: 1 },
        { id: 1, name: "Shared root", parent_id: 0 },
      ])

    render(<CourseSearch />)
    const user = await submitSearch("First")
    await user.click(
      await screen.findByRole("button", { name: "Collapse Shared root" }),
    )
    expect(screen.queryByText("- First child")).toBeNull()

    const input = screen.getByRole("textbox", { name: "Search" })
    await user.clear(input)
    await user.type(input, "New")
    await user.click(screen.getByRole("button", { name: "Search" }))

    expect(await screen.findByText("- New child")).toBeTruthy()
    expect(
      screen.getByRole("button", { name: "Collapse Shared root" }),
    ).toBeTruthy()
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
