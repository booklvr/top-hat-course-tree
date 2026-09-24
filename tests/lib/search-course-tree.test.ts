import { afterEach, describe, expect, it, vi } from "vitest"

import {
  parseCourseTreeSearchPayload,
  SEARCH_ERROR_MESSAGE,
  searchCourseTree,
} from "@/lib/search-course-tree"
import { courseTreeSearchResponseSchema } from "@/schemas/course-tree/courseTreeSchema"

const sampleItems = [
  { id: 1, name: "Lab Experiment 1", parent_id: 0 },
  { id: 3, name: "Surface Chemistry", parent_id: 1 },
]

describe("courseTreeSearchResponseSchema (boundary)", () => {
  it("accepts a raw array of course items", () => {
    const result = courseTreeSearchResponseSchema.safeParse(sampleItems)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(sampleItems)
    }
  })

  it("rejects an unexpected payload shape", () => {
    const result = courseTreeSearchResponseSchema.safeParse({
      detail: "Not Found",
    })
    expect(result.success).toBe(false)
  })
})

describe("parseCourseTreeSearchPayload", () => {
  it("accepts valid payloads", () => {
    expect(parseCourseTreeSearchPayload(sampleItems)).toEqual(sampleItems)
  })

  it("maps invalid payloads to the user-facing search error", () => {
    expect(() => parseCourseTreeSearchPayload({ detail: "Not Found" })).toThrow(
      SEARCH_ERROR_MESSAGE,
    )
  })
})

describe("searchCourseTree", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("sends the query to the API and returns valid course items", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(sampleItems),
    })
    vi.stubGlobal("fetch", fetchMock)

    await expect(searchCourseTree("Lab & notes")).resolves.toEqual(sampleItems)

    const requestedUrl = fetchMock.mock.calls[0][0] as URL
    expect(requestedUrl.searchParams.get("query")).toBe("Lab & notes")
  })

  it("surfaces a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Offline")))

    await expect(searchCourseTree("Lab")).rejects.toThrow(SEARCH_ERROR_MESSAGE)
  })

  it("treats a non-success HTTP response as a search failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }))

    await expect(searchCourseTree("Lab")).rejects.toThrow(SEARCH_ERROR_MESSAGE)
  })

  it("treats an invalid JSON response as a search failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockRejectedValue(new SyntaxError("Invalid JSON")),
      }),
    )

    await expect(searchCourseTree("Lab")).rejects.toThrow(SEARCH_ERROR_MESSAGE)
  })

  it("treats an invalid response body as a search failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ detail: "Not Found" }),
      }),
    )

    await expect(searchCourseTree("Lab")).rejects.toThrow(SEARCH_ERROR_MESSAGE)
  })
})
