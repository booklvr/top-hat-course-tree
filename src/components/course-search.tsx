import { useState, type SubmitEvent } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { searchCourseTree } from "@/api/course-tree-search"
import { flattenCourseTree, type CourseTreeRow } from "@/lib/course-tree"
import { SEARCH_ERROR_MESSAGE } from "@/lib/search-course-tree"

type RequestStatus = "idle" | "loading" | "success" | "error"

function SearchResultsSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <Skeleton className="h-4 w-full max-w-lg" />
      <Skeleton className="ml-4 h-4 w-full max-w-md" />
      <Skeleton className="ml-8 h-4 w-full max-w-sm" />
      <Skeleton className="ml-4 h-4 w-full max-w-md" />
      <Skeleton className="h-4 w-full max-w-xs" />
    </div>
  )
}

export function CourseSearch() {
  const [query, setQuery] = useState("")
  const [rows, setRows] = useState<CourseTreeRow[]>([])
  const [status, setStatus] = useState<RequestStatus>("idle")

  const trimmedQuery = query.trim()
  const isLoading = status === "loading"

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!trimmedQuery || isLoading) return

    setStatus("loading")

    try {
      const items = await searchCourseTree(trimmedQuery)
      setRows(flattenCourseTree(items))
      setStatus("success")
    } catch {
      setRows([])
      setStatus("error")
    }
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
          <CardDescription>
            Search course content by keyword.
          </CardDescription>
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

            {status === "success" && rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No course items found.
              </p>
            ) : null}

            {status === "success" && rows.length > 0 ? (
              <ul className="flex flex-col gap-1.5 text-sm leading-relaxed">
                {rows.map((row) => (
                  <li key={row.item.id}>
                    {"- ".repeat(row.depth)}
                    {row.item.name}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
