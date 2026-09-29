import { courseTreeSearchResponseSchema } from "../shared/course-tree-contract.ts"

/**
 * In-memory data keeps this interview-sized API runnable without a database.
 * `searchCourseTree` accepts its data as an argument, so replacing this with a
 * repository/database call does not require changing the HTTP contract.
 */
export const courseTreeItems = courseTreeSearchResponseSchema.parse([
  { id: 5, name: "Chemical Kinetics", parent_id: 6 },
  { id: 3, name: "Surface Chemistry", parent_id: 1 },
  { id: 1, name: "Lab Experiment 1", parent_id: 0 },
  { id: 4, name: "Lab 1 Summary", parent_id: 1 },
  { id: 2, name: "Colloidal Solution (sol) of Starch", parent_id: 3 },
  { id: 6, name: "Lab Experiment 2", parent_id: 0 },
  { id: 7, name: "Colloidal Solution of Gum", parent_id: 3 },
])
