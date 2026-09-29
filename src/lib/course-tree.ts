import type { CourseItem } from "@/schemas/course-tree/courseTreeSchema";

/**
 * One row in render order.
 * `depth` is steps from a root: `0` for a root, then `1`, `2`, and so on.
 */
export type CourseTreeRow = {
  item: CourseItem;
  depth: number;
};

export type CollapsibleCourseTreeRow = CourseTreeRow & {
  hasChildren: boolean;
};

/**
 * Converts a flat course tree into display order.
 *
 * Items are emitted with a preorder depth-first traversal, so each parent
 * is immediately followed by its descendants. Roots have depth 0, and each
 * nested level increases depth by one. Root and sibling order are preserved.
 */
export function flattenCourseTree(items: CourseItem[]): CourseTreeRow[] {
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

  // Preorder: emit the child, then walk its children before the next sibling.
  // That places the whole subtree directly after the parent.
  function appendSubtree(parentId: number, depth: number) {
    const children = childrenByParentId.get(parentId);
    if (!children) return;

    for (const item of children) {
      rows.push({ item, depth });
      appendSubtree(item.id, depth + 1);
    }
  }

  // Roots are the children of parent id 0, so they start at depth 0.
  // Each recursive call passes depth + 1 to that parent's children.
  appendSubtree(0, 0);
  return rows;
}

/**
 * Derives the currently visible rows without changing the flat preorder model.
 *
 * In preorder, a node has children when the following row is deeper. When a
 * node is collapsed, every following row remains hidden until traversal reaches
 * the same depth (a sibling) or a shallower depth (an ancestor's sibling).
 */
export function getVisibleCourseTreeRows(
  rows: CourseTreeRow[],
  collapsedItemIds: ReadonlySet<number>,
): CollapsibleCourseTreeRow[] {
  const visibleRows: CollapsibleCourseTreeRow[] = [];
  let collapsedAncestorDepth: number | null = null;

  for (const [index, row] of rows.entries()) {
    if (
      collapsedAncestorDepth !== null &&
      row.depth > collapsedAncestorDepth
    ) {
      continue;
    }

    collapsedAncestorDepth = null;
    const hasChildren = (rows[index + 1]?.depth ?? -1) > row.depth;
    visibleRows.push({ ...row, hasChildren });

    if (hasChildren && collapsedItemIds.has(row.item.id)) {
      collapsedAncestorDepth = row.depth;
    }
  }

  return visibleRows;
}
