import {
  courseTreeSearchRequestSchema,
  courseTreeSearchResponseSchema,
  type CourseItem,
} from "@shared/course-tree-contract";

// A relative default keeps browser requests same-origin. During development,
// Vite proxies `/api` to the local service; production can use the same reverse
// proxy shape or provide an absolute VITE_COURSE_TREE_SEARCH_URL at build time.
const COURSE_TREE_SEARCH_URL =
  import.meta.env.VITE_COURSE_TREE_SEARCH_URL ?? "/api/treesearch/";

export const SEARCH_ERROR_MESSAGE =
  "Unable to search the course tree. Please try again.";

/**
 * Validates and normalizes the API JSON body into a flat list of course items.
 */
export function parseCourseTreeSearchPayload(payload: unknown): CourseItem[] {
  try {
    return courseTreeSearchResponseSchema.parse(payload);
  } catch {
    throw new Error(SEARCH_ERROR_MESSAGE);
  }
}

/**
 * Searches the configured course-tree endpoint and returns the flat list of items.
 */
export async function searchCourseTree(query: string): Promise<CourseItem[]> {
  let parsedQuery: string;
  try {
    parsedQuery = courseTreeSearchRequestSchema.parse({ query }).query;
  } catch {
    throw new Error(SEARCH_ERROR_MESSAGE);
  }

  const baseUrl = globalThis.location?.origin ?? "http://localhost";
  const url = new URL(COURSE_TREE_SEARCH_URL, baseUrl);
  url.searchParams.set("query", parsedQuery);

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error(SEARCH_ERROR_MESSAGE);
  }

  if (!response.ok) {
    throw new Error(SEARCH_ERROR_MESSAGE);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error(SEARCH_ERROR_MESSAGE);
  }

  return parseCourseTreeSearchPayload(payload);
}
