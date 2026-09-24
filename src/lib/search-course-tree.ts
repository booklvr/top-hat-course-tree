import {
  courseTreeSearchResponseSchema,
  type CourseItem,
} from "@/schemas/course-tree/courseTreeSchema";

const COURSE_TREE_SEARCH_URL =
  "https://coursetreesearch-service-sandbox.dev.tophat.com/treesearch/";

export const SEARCH_ERROR_MESSAGE =
  "Unable to search the course tree. Please try again.";

/**
 * Validates and normalizes the sandbox API JSON body into a flat list of course items.
 */
export function parseCourseTreeSearchPayload(payload: unknown): CourseItem[] {
  try {
    return courseTreeSearchResponseSchema.parse(payload);
  } catch {
    throw new Error(SEARCH_ERROR_MESSAGE);
  }
}

/**
 * Searches Top Hat's course-tree endpoint and returns the flat list of items.
 */
export async function searchCourseTree(query: string): Promise<CourseItem[]> {
  const url = new URL(COURSE_TREE_SEARCH_URL);
  url.searchParams.set("query", query);

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
