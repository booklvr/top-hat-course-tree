import { getCourseTreeFixture } from "@/mocks/course-tree-data"
import { filterCourseTreeByQuery } from "@/mocks/filter-course-tree"
import { getMockScenario } from "@/mocks/mock-scenario"
import { SEARCH_ERROR_MESSAGE } from "@/lib/search-course-tree"
import type { CourseItem } from "@/schemas/course-tree/courseTreeSchema"

const MOCK_NETWORK_DELAY_MS = 1000

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export async function searchMockCourseTree(query: string): Promise<CourseItem[]> {
  await delay(MOCK_NETWORK_DELAY_MS)

  const scenario = getMockScenario()

  if (scenario === "network-failure") {
    throw new Error(SEARCH_ERROR_MESSAGE)
  }

  // Matches the sandbox API tip: query "error" returns an empty result set.
  if (query.trim().toLowerCase() === "error") {
    return []
  }

  if (scenario === "empty") {
    return []
  }

  const fixture = getCourseTreeFixture(scenario)
  if (!fixture) {
    return []
  }

  return filterCourseTreeByQuery(fixture, query)
}
