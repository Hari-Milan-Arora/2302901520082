import { loggingMiddleware } from "../middlewares/logging.middleware.js";

export async function createNotification(input) {
  await loggingMiddleware({
    stack: "backend",
    level: "info",
    pkg: "service",
    message: `createNotification invoked for title="${input.title ?? ""}" and channel="${input.channel ?? ""}"`,
  });

  return {
    id: crypto.randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  };
}
