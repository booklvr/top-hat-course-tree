/**
 * Zod schemas for the Top Hat course tree search API.
 *
 * TypeScript types are erased at runtime, so Zod validates the untrusted API
 * response at the network boundary (`fetch` JSON → typed flat list).
 */

import { z } from "zod"

export const courseItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  parent_id: z.number(),
})

/** The search API returns a flat array of course items. */
export const courseTreeSearchResponseSchema = z.array(courseItemSchema)

/**
 * Output types — derived from schemas (single source of truth).
 */

/** One course node from the API. `parent_id === 0` means this item is a root. */
export type CourseItem = z.infer<typeof courseItemSchema>
