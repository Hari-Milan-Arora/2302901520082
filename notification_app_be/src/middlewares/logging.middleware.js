import { Log } from "logging-middleware";

export async function loggingMiddleware({ stack, level, pkg, message }) {
  try {
    await Log(stack, level, pkg, message);
  } catch (error) {
    console.error("Logging middleware failed:", error.message);
  }
}
