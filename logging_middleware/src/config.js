export const LOG_API_URL = "http://4.224.186.213/evaluation-service/logs";

export const ALLOWED_STACKS = new Set(["backend", "frontend"]);
export const ALLOWED_LEVELS = new Set(["debug", "info", "warn", "error", "fatal"]);
export const ALLOWED_PACKAGES = new Set([
  "handler",
  "repository",
  "route",
  "service",
  "api",
  "component",
  "hook",
  "page",
  "state",
  "style",
  "auth",
  "config",
  "middleware",
  "utils",
]);
