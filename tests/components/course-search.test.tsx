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

  it("saves search terms and reruns a search selected from history", async () => {
    searchCourseTreeMock.mockResolvedValue([])

    render(<CourseSearch />)
    const user = await submitSearch("Lab")
    await screen.findByText("No course items found.")

    const input = screen.getByRole("textbox", { name: "Search" })
    await user.clear(input)
    await user.type(input, "Quiz")
    await user.click(screen.getByRole("button", { name: "Search" }))
    await screen.findByText("No course items found.")

    await user.click(screen.getByRole("combobox", { name: "Previous searches" }))
    await user.click(await screen.findByRole("option", { name: "Lab" }))

    expect(input.getAttribute("value")).toBe("Lab")
    expect(searchCourseTreeMock).toHaveBeenLastCalledWith("Lab")
    expect(searchCourseTreeMock).toHaveBeenCalledTimes(3)
  })

  it("stores a repeated search term only once", async () => {
    searchCourseTreeMock.mockResolvedValue([])

    render(<CourseSearch />)
    const user = await submitSearch("Lab")
    await screen.findByText("No course items found.")
    await user.click(screen.getByRole("button", { name: "Search" }))
    await screen.findByText("No course items found.")

    await user.click(screen.getByRole("combobox", { name: "Previous searches" }))
    expect(await screen.findAllByRole("option", { name: "Lab" })).toHaveLength(1)
  })

  it("orders unique search terms from most to least recent", async () => {
    searchCourseTreeMock.mockResolvedValue([])

    render(<CourseSearch />)
    const user = await submitSearch("Lab")
    await screen.findByText("No course items found.")

    const input = screen.getByRole("textbox", { name: "Search" })
    await user.clear(input)
    await user.type(input, "Quiz")
    await user.click(screen.getByRole("button", { name: "Search" }))
    await screen.findByText("No course items found.")
    await user.click(screen.getByRole("button", { name: "Search" }))
    await screen.findByText("No course items found.")

    await user.click(screen.getByRole("combobox", { name: "Previous searches" }))
    expect(
      (await screen.findAllByRole("option")).map((option) => option.textContent),
    ).toEqual(["Quiz", "Lab"])
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
