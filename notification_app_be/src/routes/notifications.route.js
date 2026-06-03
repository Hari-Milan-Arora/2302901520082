const DEFAULT_NOTIFICATION_API_URL = "http://4.224.186.213/evaluation-service/notifications";

export async function notificationsRoute(request, response) {
  if (
    request.method !== "GET" ||
    request.url.startsWith("/notifications/priority") ||
    !request.url.startsWith("/notifications")
  ) {
    return false;
  }

  const incoming = new URL(request.url, "http://localhost");
  const target = new URL(process.env.NOTIFICATION_API_URL ?? DEFAULT_NOTIFICATION_API_URL);

  target.search = incoming.search;

  const headers = {
    Accept: "application/json",
  };

  const authHeader = resolveAuthHeader();
  if (authHeader) {
    headers.Authorization = authHeader;
  }

  const upstream = await fetch(target, { headers });
  const body = await upstream.text();

  response.writeHead(upstream.status, {
    "Content-Type": upstream.headers.get("content-type") ?? "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  response.end(body);
  return true;
}

function resolveAuthHeader() {
  const directHeader = process.env.NOTIFICATION_API_AUTH_HEADER?.trim();
  if (directHeader) {
    return directHeader;
  }

  const token = process.env.NOTIFICATION_API_AUTH_TOKEN?.trim();
  if (token) {
    return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }

  const fallback = process.env.LOG_API_AUTH_HEADER?.trim();
  if (fallback) {
    return fallback;
  }

  return null;
}
