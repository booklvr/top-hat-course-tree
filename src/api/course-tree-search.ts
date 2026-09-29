import { searchCourseTree as searchLiveCourseTree } from "@/lib/search-course-tree"
import {
  filterCourseTreeByTerms,
  getSearchTerms,
} from "@/lib/course-tree-search-results"
import type { CourseItem } from "@/schemas/course-tree/courseTreeSchema"

const useMockApi = import.meta.env.VITE_USE_MOCK_API === "true"

/**
 * Course tree search used by the UI: live sandbox API, or local mocks when
 * `VITE_USE_MOCK_API=true` (see `pnpm dev:mock`).
 */
export async function searchCourseTree(query: string): Promise<CourseItem[]> {
  const terms = getSearchTerms(query)
  if (terms.length === 0) return []

  const search = useMockApi
    ? (await import("@/mocks/search-course-tree")).searchMockCourseTree
    : searchLiveCourseTree

  // The server accepts one substring at a time, so perform the independent
  // searches concurrently and apply AND semantics after merging the results.
  const responses = await Promise.all(terms.map((term) => search(term)))
  const itemsById = new Map<number, CourseItem>()

  for (const items of responses) {
    for (const item of items) {
      if (!itemsById.has(item.id)) {
        itemsById.set(item.id, item)
      }
    }
  }

  return filterCourseTreeByTerms(itemsById, terms)
}
