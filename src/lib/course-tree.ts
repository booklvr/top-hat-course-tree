import type { CourseItem } from "@/schemas/course-tree/courseTreeSchema";
import { assertValidCourseTree } from "@/lib/validate-course-tree";

/**
 * One row in render order.
 * `depth` is steps from a root: `0` for a root, then `1`, `2`, and so on.
 */
export type CourseTreeRow = {
  item: CourseItem;
  depth: number;
};

/**
 * Converts a flat course tree into display order.
 *
 * Items are emitted with a preorder depth-first traversal, so each parent
 * is immediately followed by its descendants. Roots have depth 0, and each
 * nested level increases depth by one. Root and sibling order are preserved.
 */
export function flattenCourseTree(items: CourseItem[]): CourseTreeRow[] {
  assertValidCourseTree(items);

  // Index children by parent so the walk can find a parent's children in one
  // lookup. parent_id 0 holds the roots. Push keeps input encounter order.
  const childrenByParentId = new Map<number, CourseItem[]>();

  for (const item of items) {
    const siblings = childrenByParentId.get(item.parent_id);
    if (siblings) {
      siblings.push(item);
    } else {
      childrenByParentId.set(item.parent_id, [item]);
    }
  }

  const rows: CourseTreeRow[] = [];
  const pendingRows: CourseTreeRow[] = [];
  const roots = childrenByParentId.get(0) ?? [];

  // Push in reverse order because the stack is last-in, first-out. This is an
  // iterative preorder traversal: emit a parent, then each of its descendants.
  for (let index = roots.length - 1; index >= 0; index -= 1) {
    pendingRows.push({ item: roots[index], depth: 0 });
  }

  while (pendingRows.length > 0) {
    const row = pendingRows.pop();
    if (!row) break;

    rows.push(row);
    const children = childrenByParentId.get(row.item.id) ?? [];
    for (let index = children.length - 1; index >= 0; index -= 1) {
      pendingRows.push({ item: children[index], depth: row.depth + 1 });
    }
  }

  return rows;
}
