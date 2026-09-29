import { useState, type SubmitEvent } from "react";

import { searchCourseTree } from "@/api/course-tree-search";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { buildCourseTree, type CourseTreeNode } from "@/lib/course-tree";
import { SEARCH_ERROR_MESSAGE } from "@/lib/search-course-tree";

type RequestStatus = "idle" | "loading" | "success" | "error";

function SearchResultsSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <Skeleton className="h-4 w-full max-w-lg" />
      <Skeleton className="ml-4 h-4 w-full max-w-md" />
      <Skeleton className="ml-8 h-4 w-full max-w-sm" />
      <Skeleton className="ml-4 h-4 w-full max-w-md" />
      <Skeleton className="h-4 w-full max-w-xs" />
    </div>
  );
}

function CourseTreeNodeView({
  node,
  depth,
  collapsedNodeIds,
  onToggle,
}: {
  node: CourseTreeNode;
  depth: number;
  collapsedNodeIds: Set<number>;
  onToggle: (nodeId: number) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = hasChildren && !collapsedNodeIds.has(node.item.id);

  return (
    <>
      <li>
        <span>
          {"- ".repeat(depth)}
          {node.item.name}
        </span>
        {hasChildren ? (
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? "Collapse" : "Expand"} ${node.item.name}`}
            onClick={() => onToggle(node.item.id)}
            className="ml-2 inline-flex size-5 items-center justify-center rounded border text-xs hover:bg-muted focus-visible:outline-2"
          >
            {isExpanded ? "−" : "+"}
          </button>
        ) : null}
      </li>

      {isExpanded
        ? node.children.map((child) => (
            <CourseTreeNodeView
              key={child.item.id}
              node={child}
              depth={depth + 1}
              collapsedNodeIds={collapsedNodeIds}
              onToggle={onToggle}
            />
          ))
        : null}
    </>
  );
}

export function CourseSearch() {
  const [query, setQuery] = useState("");
  const [tree, setTree] = useState<CourseTreeNode[]>([]);
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<number>>(
    new Set(),
  );
  const [status, setStatus] = useState<RequestStatus>("idle");

  const trimmedQuery = query.trim();
  const isLoading = status === "loading";

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!trimmedQuery || isLoading) return;

    setStatus("loading");

    try {
      const items = await searchCourseTree(trimmedQuery);
      setTree(buildCourseTree(items));
      setCollapsedNodeIds(new Set());
      setStatus("success");
    } catch {
      setTree([]);
      setCollapsedNodeIds(new Set());
      setStatus("error");
    }
  }

  function toggleNode(nodeId: number) {
    setCollapsedNodeIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (nextIds.has(nodeId)) {
        nextIds.delete(nodeId);
      } else {
        nextIds.add(nodeId);
      }
      return nextIds;
    });
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-16">
      <img
        src="/brand/top-hat-logo.svg"
        alt="Top Hat"
        width={440}
        height={440}
        className="mb-8 w-[5.5rem] self-center rounded-xl bg-white p-3 shadow-xs ring-1 ring-border/50"
      />
      <Card>
        <CardHeader className="space-y-1.5">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Course Tree Search
          </h1>
          <CardDescription>Search course content by keyword.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-0">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <label htmlFor="course-search" className="text-sm font-medium">
                  Search
                </label>
                <Input
                  id="course-search"
                  name="query"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="e.g. Lab"
                  autoComplete="off"
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                disabled={!trimmedQuery || isLoading}
                className="min-w-24 shrink-0 hover:bg-primary-hover"
              >
                Search
              </Button>
            </div>
          </form>

          <section
            aria-live="polite"
            aria-busy={isLoading}
            className="mt-6 min-h-44 border-t pt-6"
          >
            {status === "idle" ? (
              <p className="text-sm text-muted-foreground">
                Results will appear here.
              </p>
            ) : null}

            {status === "loading" ? <SearchResultsSkeleton /> : null}

            {status === "error" ? (
              <p role="alert" className="text-sm text-destructive/80">
                {SEARCH_ERROR_MESSAGE}
              </p>
            ) : null}

            {status === "success" && tree.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No course items found.
              </p>
            ) : null}

            {status === "success" && tree.length > 0 ? (
              <ul className="flex flex-col gap-1.5 text-sm leading-relaxed">
                {tree.map((node) => (
                  <CourseTreeNodeView
                    key={node.item.id}
                    node={node}
                    depth={0}
                    collapsedNodeIds={collapsedNodeIds}
                    onToggle={toggleNode}
                  />
                ))}
              </ul>
            ) : null}
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
