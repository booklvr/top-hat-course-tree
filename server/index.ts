import { createServer } from "node:http";

import { createCourseTreeApiHandler } from "./course-tree-api.ts";

const DEFAULT_PORT = 3001;
const parsedPort = Number.parseInt(process.env.PORT ?? "", 10);
const port =
  Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : DEFAULT_PORT;
const allowedOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

const server = createServer(createCourseTreeApiHandler({ allowedOrigin }));

server.listen(port, () => {
  console.log(`Course tree API listening on http://localhost:${port}`);
});

// Stop accepting new requests and let current requests finish during local
// restarts or container termination.
function shutDown(signal: NodeJS.Signals) {
  console.log(`Received ${signal}; shutting down the course tree API.`);
  server.close((error) => {
    if (error) {
      console.error("Course tree API shutdown failed", error);
      process.exitCode = 1;
    }
  });
}

process.once("SIGINT", shutDown);
process.once("SIGTERM", shutDown);
