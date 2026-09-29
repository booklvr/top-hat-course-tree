import type { CourseItem } from "@/schemas/course-tree/courseTreeSchema";

export type CourseTreeNode = {
  item: CourseItem;
  children: CourseTreeNode[];
};

/**
 * Converts the API's flat course items into a nested tree.
 *
 * Nodes are indexed before parent-child relationships are connected, so a
 * child can appear before its parent in the input. The second pass follows
 * input encounter order, preserving root and sibling order in O(n) time.
 */
export function buildCourseTree(items: CourseItem[]): CourseTreeNode[] {
  const nodesById = new Map<number, CourseTreeNode>();

  for (const item of items) {
    nodesById.set(item.id, { item, children: [] });
  }

  const roots: CourseTreeNode[] = [];

  for (const item of items) {
    const node = nodesById.get(item.id);
    if (!node) continue;

    if (item.parent_id === 0) {
      roots.push(node);
      continue;
    }

    nodesById.get(item.parent_id)?.children.push(node);
  }

  return roots;
}
