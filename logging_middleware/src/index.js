import { ALLOWED_LEVELS, ALLOWED_PACKAGES, ALLOWED_STACKS } from "./config.js";
import { postLog } from "./http.js";

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function assertAllowed(field, value, allowed) {
  if (!allowed.has(value)) {
    throw new Error(
      `Invalid ${field}: "${value}". Allowed values are: ${Array.from(allowed).join(", ")}`
    );
  }
}

export async function Log(stack, level, pkg, message) {
  const normalizedStack = normalize(stack);
  const normalizedLevel = normalize(level);
  const normalizedPackage = normalize(pkg);

  assertAllowed("stack", normalizedStack, ALLOWED_STACKS);
  assertAllowed("level", normalizedLevel, ALLOWED_LEVELS);
  assertAllowed("package", normalizedPackage, ALLOWED_PACKAGES);

  const payload = {
    stack: normalizedStack,
    level: normalizedLevel,
    package: normalizedPackage,
    message: String(message ?? ""),
  };

  return postLog(payload);
}

export default Log;
