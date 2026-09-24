import { searchCourseTree as searchLiveCourseTree } from "@/lib/search-course-tree"
import type { CourseItem } from "@/schemas/course-tree/courseTreeSchema"

const useMockApi = import.meta.env.VITE_USE_MOCK_API === "true"

/**
 * Course tree search used by the UI: live sandbox API, or local mocks when
 * `VITE_USE_MOCK_API=true` (see `pnpm dev:mock`).
 */
export async function searchCourseTree(query: string): Promise<CourseItem[]> {
  if (useMockApi) {
    const { searchMockCourseTree } = await import("@/mocks/search-course-tree")
    return searchMockCourseTree(query)
  }

  return searchLiveCourseTree(query)
}
