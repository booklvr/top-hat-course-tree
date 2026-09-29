import type { IncomingMessage, ServerResponse } from "node:http"

import {
  apiErrorResponseSchema,
  courseTreeSearchRequestSchema,
  courseTreeSearchResponseSchema,
  healthResponseSchema,
  type ApiErrorCode,
} from "../shared/course-tree-contract.ts"
import { courseTreeItems } from "./course-tree-data.ts"
import { searchCourseTree } from "./search-course-tree.ts"

type SearchOptions = {
  signal: AbortSignal
}

type SearchProvider = (
  query: string,
  options: SearchOptions,
) => Promise<unknown>

type Logger = Pick<Console, "error">

export type CourseTreeApiOptions = {
  allowedOrigin?: string
  logger?: Logger
  search?: SearchProvider
}

function defaultSearch(query: string, { signal }: SearchOptions) {
  signal.throwIfAborted()
  const results = searchCourseTree(courseTreeItems, query)
  signal.throwIfAborted()
  return Promise.resolve(results)
}

function setCommonHeaders(
  request: IncomingMessage,
  response: ServerResponse,
  allowedOrigin?: string,
) {
  response.setHeader("X-Content-Type-Options", "nosniff")

  // Echo only the configured origin. Using `*` would be inappropriate if this
  // endpoint later gained credentials or user-specific course information.
  if (allowedOrigin && request.headers.origin === allowedOrigin) {
    response.setHeader("Access-Control-Allow-Origin", allowedOrigin)
    response.setHeader("Vary", "Origin")
  }
}

function sendJson(response: ServerResponse, status: number, payload: unknown) {
  if (response.destroyed || response.writableEnded) return

  const body = JSON.stringify(payload)
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
    "Content-Type": "application/json; charset=utf-8",
  })
  response.end(body)
}

function sendError(
  response: ServerResponse,
  status: number,
  code: ApiErrorCode,
  message: string,
) {
  const payload = apiErrorResponseSchema.parse({ error: { code, message } })
  sendJson(response, status, payload)
}

/**
 * Creates a Node request handler with injectable search and logging. Injection
 * keeps HTTP tests deterministic and lets a real database repository replace
 * the in-memory search later.
 */
export function createCourseTreeApiHandler({
  allowedOrigin,
  logger = console,
  search = defaultSearch,
}: CourseTreeApiOptions = {}) {
  return async (request: IncomingMessage, response: ServerResponse) => {
    setCommonHeaders(request, response, allowedOrigin)

    const url = new URL(request.url ?? "/", "http://localhost")

    const isSearchRoute =
      url.pathname === "/treesearch/" || url.pathname === "/treesearch"

    if (request.method === "OPTIONS" && isSearchRoute) {
      response.writeHead(204, {
        Allow: "GET, OPTIONS",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      })
      response.end()
      return
    }

    if (url.pathname === "/health" && request.method === "GET") {
      sendJson(response, 200, healthResponseSchema.parse({ status: "ok" }))
      return
    }

    if (!isSearchRoute) {
      sendError(response, 404, "NOT_FOUND", "Route not found.")
      return
    }

    if (request.method !== "GET") {
      response.setHeader("Allow", "GET, OPTIONS")
      sendError(
        response,
        405,
        "METHOD_NOT_ALLOWED",
        "Only GET is supported for this route.",
      )
      return
    }

    const queryValues = url.searchParams.getAll("query")

    if (queryValues.length !== 1) {
      sendError(
        response,
        400,
        "INVALID_QUERY",
        "Provide exactly one non-empty query parameter.",
      )
      return
    }

    const parsedRequest = courseTreeSearchRequestSchema.safeParse({
      query: queryValues[0],
    })

    if (!parsedRequest.success) {
      sendError(
        response,
        400,
        "INVALID_QUERY",
        parsedRequest.error.issues[0]?.message ?? "Query is invalid.",
      )
      return
    }

    // An AbortSignal is local to the server; it is not the browser's signal.
    // It translates an HTTP disconnect into something a database driver or
    // downstream fetch can consume.
    const requestController = new AbortController()
    const abortRequest = () => requestController.abort()
    request.once("aborted", abortRequest)
    response.once("close", abortRequest)

    try {
      const result = await search(parsedRequest.data.query, {
        signal: requestController.signal,
      })
      const items = courseTreeSearchResponseSchema.parse(result)
      if (!requestController.signal.aborted) {
        sendJson(response, 200, items)
      }
    } catch (error) {
      if (!requestController.signal.aborted) {
        logger.error("Course tree search failed", error)
        sendError(
          response,
          500,
          "INTERNAL_ERROR",
          "Unable to search the course tree.",
        )
      }
    } finally {
      request.removeListener("aborted", abortRequest)
      response.removeListener("close", abortRequest)
    }
  }
}
