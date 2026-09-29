# Nested course tree notes

This branch explores a nested representation for the course tree. Neither
representation is universally better; the useful choice depends on the UI's
needs.

## Flat representation

Advantages:

- Directly matches render order.
- Makes depth-based indentation and linear iteration simple.
- Is well suited to the original assignment.

Disadvantages:

- Subtree operations require reasoning about ranges of row depths.
- Expand/collapse is less structurally direct.

## Nested representation

Advantages:

- Represents hierarchy explicitly.
- Makes child traversal intuitive.
- Makes expand/collapse and other subtree operations easier to express.

Disadvantages:

- Requires recursive rendering or another traversal.
- Differs from the flat API response.
- Adds complexity that the original assignment may not need.
