/**
 * Compatibility entrypoint for existing client imports. The actual transport
 * contract lives outside `src` so both the browser and Node API use one schema.
 */
export {
  courseItemSchema,
  courseTreeSearchRequestSchema,
  courseTreeSearchResponseSchema,
} from "../../../shared/course-tree-contract"

export type {
  CourseItem,
  CourseTreeSearchRequest,
  CourseTreeSearchResponse,
} from "../../../shared/course-tree-contract"
