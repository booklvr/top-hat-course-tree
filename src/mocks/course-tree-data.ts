import type { CourseItem } from "@/schemas/course-tree/courseTreeSchema"

import type { MockScenarioId } from "@/mocks/mock-scenario"

/** Top Hat lab sample (matches course-tree tests). */
export const labCourseTree: CourseItem[] = [
  { id: 5, name: "Chemical Kinetics", parent_id: 6 },
  { id: 3, name: "Surface Chemistry", parent_id: 1 },
  { id: 1, name: "Lab Experiment 1", parent_id: 0 },
  { id: 4, name: "Lab 1 Summary", parent_id: 1 },
  { id: 2, name: "Colloidal Solution (sol) of Starch", parent_id: 3 },
  { id: 6, name: "Lab Experiment 2", parent_id: 0 },
  { id: 7, name: "Colloidal Solution of Gum", parent_id: 3 },
]

export const biologyCourseTree: CourseItem[] = [
  { id: 100, name: "Introduction to Biology", parent_id: 0 },
  { id: 101, name: "Cell Structure", parent_id: 100 },
  { id: 102, name: "Mitosis Overview", parent_id: 101 },
  { id: 103, name: "Stages of Mitosis", parent_id: 102 },
  { id: 104, name: "Prophase", parent_id: 103 },
  { id: 105, name: "Metaphase", parent_id: 103 },
  { id: 106, name: "Genetics", parent_id: 100 },
  { id: 107, name: "DNA Replication", parent_id: 106 },
  { id: 108, name: "Ecology", parent_id: 0 },
  { id: 109, name: "Ecosystems", parent_id: 108 },
]

export const deepCourseTree: CourseItem[] = [
  { id: 200, name: "Root Module", parent_id: 0 },
  { id: 201, name: "Unit A", parent_id: 200 },
  { id: 202, name: "Chapter 1", parent_id: 201 },
  { id: 203, name: "Section 1.1", parent_id: 202 },
  { id: 204, name: "Topic Alpha", parent_id: 203 },
  { id: 205, name: "Subtopic Detail", parent_id: 204 },
  { id: 206, name: "Deep Leaf Node", parent_id: 205 },
  { id: 207, name: "Unit B", parent_id: 200 },
  { id: 208, name: "Chapter 2", parent_id: 207 },
]

function buildManyCourseTree(): CourseItem[] {
  const items: CourseItem[] = []
  let nextId = 300

  for (let course = 1; course <= 3; course += 1) {
    const courseId = nextId
    nextId += 1
    items.push({
      id: courseId,
      name: `Course ${course}`,
      parent_id: 0,
    })

    for (let module = 1; module <= 4; module += 1) {
      const moduleId = nextId
      nextId += 1
      items.push({
        id: moduleId,
        name: `Course ${course} — Module ${module}`,
        parent_id: courseId,
      })

      for (let lesson = 1; lesson <= 5; lesson += 1) {
        const lessonId = nextId
        nextId += 1
        items.push({
          id: lessonId,
          name: `Course ${course} Module ${module} Lesson ${lesson}`,
          parent_id: moduleId,
        })
      }
    }
  }

  return items
}

export const manyCourseTree: CourseItem[] = buildManyCourseTree()

const fixturesByScenario: Record<
  Extract<MockScenarioId, "lab" | "biology" | "deep" | "many">,
  CourseItem[]
> = {
  lab: labCourseTree,
  biology: biologyCourseTree,
  deep: deepCourseTree,
  many: manyCourseTree,
}

export function getCourseTreeFixture(
  scenario: MockScenarioId,
): CourseItem[] | null {
  if (scenario === "empty" || scenario === "network-failure") {
    return null
  }

  return fixturesByScenario[scenario]
}
