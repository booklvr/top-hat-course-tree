// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { searchCourseTree } from "@/api/course-tree-search"
import { CourseSearch } from "@/components/course-search"
import { SEARCH_ERROR_MESSAGE } from "@/lib/search-course-tree"

vi.mock("@/api/course-tree-search", () => ({
  searchCourseTree: vi.fn(),
}))

const searchCourseTreeMock = vi.mocked(searchCourseTree)
const SEARCH_DEBOUNCE_MS = 500

function changeQuery(query: string) {
  const input = screen.getByRole("textbox", { name: "Search" })
  fireEvent.change(input, { target: { value: query } })
}

async function finishDebounce() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS)
  })
}

describe("CourseSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.resetAllMocks()
  })

  it("waits until typing has paused before searching", async () => {
    searchCourseTreeMock.mockResolvedValue([])

    render(<CourseSearch />)
    changeQuery("Lab")

    await act(async () => {
      await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS - 1)
    })
    expect(searchCourseTreeMock).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(searchCourseTreeMock).toHaveBeenCalledWith(
      "Lab",
      expect.any(AbortSignal),
    )
  })

  it("restarts the debounce when only surrounding whitespace changes", async () => {
    searchCourseTreeMock.mockResolvedValue([])

    render(<CourseSearch />)
    changeQuery("Lab")
    await finishDebounce()

    changeQuery("Lab ")
    await act(async () => {
      await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS - 1)
    })
    expect(searchCourseTreeMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(searchCourseTreeMock).toHaveBeenCalledTimes(2)
    expect(searchCourseTreeMock).toHaveBeenLastCalledWith(
      "Lab",
      expect.any(AbortSignal),
    )
  })

  it("renders the indented hierarchy returned by a successful search", async () => {
    searchCourseTreeMock.mockResolvedValue([
      { id: 2, name: "Surface Chemistry", parent_id: 1 },
      { id: 1, name: "Lab Experiment 1", parent_id: 0 },
    ])

    render(<CourseSearch />)
    changeQuery("Lab")
    await finishDebounce()

    expect(screen.getByText("Lab Experiment 1")).toBeTruthy()
    expect(screen.getByText("- Surface Chemistry")).toBeTruthy()
  })

  it("shows an empty state for a successful search with no items", async () => {
    searchCourseTreeMock.mockResolvedValue([])

    render(<CourseSearch />)
    changeQuery("error")
    await finishDebounce()

    expect(screen.getByText("No course items found.")).toBeTruthy()
  })

  it("shows a retry message when the search fails", async () => {
    searchCourseTreeMock.mockRejectedValue(new Error("Network failure"))

    render(<CourseSearch />)
    changeQuery("Lab")
    await finishDebounce()

    expect(screen.getByText(SEARCH_ERROR_MESSAGE)).toBeTruthy()
  })

  it("aborts an in-flight request when the query changes", async () => {
    searchCourseTreeMock
      .mockImplementationOnce((_query, signal) =>
        new Promise((_, reject) => {
          signal?.addEventListener("abort", () => reject(signal.reason), {
            once: true,
          })
        }),
      )
      .mockResolvedValueOnce([])

    render(<CourseSearch />)
    changeQuery("Lab")
    await finishDebounce()

    const firstSignal = searchCourseTreeMock.mock.calls[0][1]
    expect(firstSignal?.aborted).toBe(false)

    changeQuery("Labs")
    expect(firstSignal?.aborted).toBe(true)
    expect(screen.queryByText(SEARCH_ERROR_MESSAGE)).toBeNull()

    await finishDebounce()
    expect(searchCourseTreeMock).toHaveBeenLastCalledWith(
      "Labs",
      expect.any(AbortSignal),
    )
    expect(screen.getByText("No course items found.")).toBeTruthy()
  })

  it("keeps the input editable while a search is in flight", async () => {
    searchCourseTreeMock.mockReturnValue(new Promise(() => {}))

    render(<CourseSearch />)
    changeQuery("Lab")
    await finishDebounce()

    expect(
      screen.getByRole("textbox", { name: "Search" }).getAttribute("disabled"),
    ).toBeNull()
  })
})
