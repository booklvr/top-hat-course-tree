import { describe, expect, it } from "vitest"

import {
  apiErrorResponseSchema,
  courseTreeSearchRequestSchema,
  courseTreeSearchResponseSchema,
} from "../../shared/course-tree-contract.ts"

describe("shared course tree API contract", () => {
  it("normalizes a valid search request", () => {
    expect(courseTreeSearchRequestSchema.parse({ query: "  Lab  " })).toEqual({
      query: "Lab",
    })
  })

  it("rejects invalid search requests", () => {
    expect(courseTreeSearchRequestSchema.safeParse({ query: " " }).success).toBe(
      false,
    )
    expect(
      courseTreeSearchRequestSchema.safeParse({ query: "a".repeat(101) })
        .success,
    ).toBe(false)
  })

  it("accepts the flat course tree response shape", () => {
    expect(
      courseTreeSearchResponseSchema.parse([
        { id: 1, name: "Lab Experiment", parent_id: 0 },
      ]),
    ).toEqual([{ id: 1, name: "Lab Experiment", parent_id: 0 }])
  })

  it("rejects malformed course items", () => {
    expect(
      courseTreeSearchResponseSchema.safeParse([
        { id: "1", name: "Lab Experiment", parent_id: 0 },
      ]).success,
    ).toBe(false)
  })

  it("restricts error responses to known codes", () => {
    expect(
      apiErrorResponseSchema.safeParse({
        error: { code: "INVALID_QUERY", message: "Invalid query." },
      }).success,
    ).toBe(true)
    expect(
      apiErrorResponseSchema.safeParse({
        error: { code: "MADE_UP_CODE", message: "Invalid query." },
      }).success,
    ).toBe(false)
  })
})
