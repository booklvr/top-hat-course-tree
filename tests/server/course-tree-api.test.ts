import { createServer, request as createRequest } from "node:http"
import type { AddressInfo } from "node:net"

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

import {
  createCourseTreeApiHandler,
  type CourseTreeApiOptions,
} from "../../server/course-tree-api.ts"

type TestServer = {
  baseUrl: string
  close: () => Promise<void>
}

async function startTestServer(
  options?: CourseTreeApiOptions,
): Promise<TestServer> {
  const server = createServer(createCourseTreeApiHandler(options))

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", resolve)
  })

  const { port } = server.address() as AddressInfo

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      }),
  }
}

describe("course tree HTTP API", () => {
  let testServer: TestServer

  beforeAll(async () => {
    testServer = await startTestServer({
      allowedOrigin: "http://localhost:5173",
    })
  })

  afterAll(async () => {
    await testServer.close()
  })

  it("returns a flat course tree for a valid search", async () => {
    const response = await fetch(`${testServer.baseUrl}/treesearch/?query=Lab`)
    const body = (await response.json()) as Array<{ id: number }>

    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toContain("application/json")
    expect(body.map((item) => item.id)).toEqual([5, 3, 1, 4, 2, 6, 7])
  })

  it("returns an empty array when there are no matches", async () => {
    const response = await fetch(
      `${testServer.baseUrl}/treesearch/?query=not-present`,
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })

  it.each([
    ["missing", "/treesearch/"],
    ["blank", "/treesearch/?query=%20%20"],
    ["repeated", "/treesearch/?query=Lab&query=Chemistry"],
  ])("rejects a %s query parameter", async (_case, path) => {
    const response = await fetch(`${testServer.baseUrl}${path}`)
    const body = (await response.json()) as {
      error: { code: string; message: string }
    }

    expect(response.status).toBe(400)
    expect(body.error.code).toBe("INVALID_QUERY")
    expect(body.error.message).not.toBe("")
  })

  it("rejects excessively long queries", async () => {
    const response = await fetch(
      `${testServer.baseUrl}/treesearch/?query=${"a".repeat(101)}`,
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({
      error: { code: "INVALID_QUERY" },
    })
  })

  it("returns 405 and an Allow header for unsupported methods", async () => {
    const response = await fetch(`${testServer.baseUrl}/treesearch/?query=Lab`, {
      method: "POST",
    })

    expect(response.status).toBe(405)
    expect(response.headers.get("allow")).toBe("GET, OPTIONS")
  })

  it("answers browser CORS preflight requests", async () => {
    const response = await fetch(`${testServer.baseUrl}/treesearch`, {
      method: "OPTIONS",
      headers: { Origin: "http://localhost:5173" },
    })

    expect(response.status).toBe(204)
    expect(response.headers.get("access-control-allow-methods")).toBe(
      "GET, OPTIONS",
    )
    expect(response.headers.get("access-control-allow-origin")).toBe(
      "http://localhost:5173",
    )
  })

  it("returns a structured 404 without exposing implementation details", async () => {
    const response = await fetch(`${testServer.baseUrl}/unknown`)

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({
      error: { code: "NOT_FOUND", message: "Route not found." },
    })
  })

  it("provides a health endpoint", async () => {
    const response = await fetch(`${testServer.baseUrl}/health`)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: "ok" })
  })

  it("allows only the configured browser origin", async () => {
    const allowedResponse = await fetch(
      `${testServer.baseUrl}/treesearch/?query=Lab`,
      { headers: { Origin: "http://localhost:5173" } },
    )
    const otherResponse = await fetch(
      `${testServer.baseUrl}/treesearch/?query=Lab`,
      { headers: { Origin: "https://untrusted.example" } },
    )

    expect(allowedResponse.headers.get("access-control-allow-origin")).toBe(
      "http://localhost:5173",
    )
    expect(otherResponse.headers.has("access-control-allow-origin")).toBe(false)
  })

  it("maps unexpected search failures to a safe 500 response", async () => {
    const logger = { error: vi.fn() }
    const failingServer = await startTestServer({
      logger,
      search: async () => {
        throw new Error("database password should not leak")
      },
    })

    try {
      const response = await fetch(
        `${failingServer.baseUrl}/treesearch/?query=Lab`,
      )
      const body = await response.text()

      expect(response.status).toBe(500)
      expect(body).toContain("Unable to search the course tree")
      expect(body).not.toContain("database password")
      expect(logger.error).toHaveBeenCalledOnce()
    } finally {
      await failingServer.close()
    }
  })

  it("aborts server-side work when the HTTP client disconnects", async () => {
    let receivedSignal: AbortSignal | undefined
    let notifySearchStarted: () => void = () => undefined
    const searchStarted = new Promise<void>((resolve) => {
      notifySearchStarted = resolve
    })
    const cancellationServer = await startTestServer({
      logger: { error: vi.fn() },
      search: (_query, { signal }) => {
        receivedSignal = signal
        notifySearchStarted()

        return new Promise((resolve) => {
          signal.addEventListener("abort", () => resolve([]), { once: true })
        })
      },
    })

    try {
      const request = createRequest(
        `${cancellationServer.baseUrl}/treesearch/?query=Lab`,
      )
      request.on("error", () => undefined)
      request.end()

      await searchStarted
      request.destroy()

      await vi.waitFor(() => expect(receivedSignal?.aborted).toBe(true))
    } finally {
      await cancellationServer.close()
    }
  })
})
