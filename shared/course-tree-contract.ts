import { z } from "zod"

/**
 * Runtime contract shared by every producer and consumer of the HTTP API.
 * TypeScript types alone disappear at runtime; these schemas validate values
 * arriving from URLs, repositories, HTTP responses, and injected providers.
 */
export const courseItemSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  parent_id: z.number().int().nonnegative(),
})

export const courseTreeSearchResponseSchema = z.array(courseItemSchema)

export const courseTreeSearchRequestSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, "Query must not be empty.")
    .max(100, "Query must be 100 characters or fewer."),
})

export const apiErrorCodeSchema = z.enum([
  "INVALID_QUERY",
  "METHOD_NOT_ALLOWED",
  "NOT_FOUND",
  "INTERNAL_ERROR",
])

export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string().min(1),
  }),
})

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
})

export type CourseItem = z.infer<typeof courseItemSchema>
export type CourseTreeSearchRequest = z.infer<
  typeof courseTreeSearchRequestSchema
>
export type CourseTreeSearchResponse = z.infer<
  typeof courseTreeSearchResponseSchema
>
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>
