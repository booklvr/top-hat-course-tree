import {
  filterCourseTreeByTerms,
  getSearchTerms,
} from "@/lib/course-tree-search-results"
import type { CourseItem } from "@/schemas/course-tree/courseTreeSchema"

/**
 * Returns items whose names match the query, plus ancestors and descendants
 * needed to preserve a valid hierarchy for flattenCourseTree.
 */
export function filterCourseTreeByQuery(
  items: CourseItem[],
  query: string,
): CourseItem[] {
  return filterCourseTreeByTerms(
    new Map(items.map((item) => [item.id, item])),
    getSearchTerms(query),
  )
}
