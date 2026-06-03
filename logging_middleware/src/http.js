import { LOG_API_URL } from "./config.js";

export async function postLog(payload, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  const authHeader = resolveAuthHeader(options);
  if (authHeader) {
    headers.Authorization = authHeader;
  }

  const response = await fetch(LOG_API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Log API request failed with ${response.status}: ${details}`);
  }

  return response.json().catch(() => null);
}

function resolveAuthHeader(options) {
  if (typeof options.authHeader === "string" && options.authHeader.trim()) {
    return options.authHeader.trim();
  }

  const directHeader = process.env.LOG_API_AUTH_HEADER?.trim();
  if (directHeader) {
    return directHeader;
  }

  const token = process.env.LOG_API_AUTH_TOKEN?.trim();
  if (token) {
    return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }

  return null;
}
