const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

async function request(path, options = {}) {
  const url = new URL(path, DEFAULT_BASE_URL);
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Request failed with ${response.status}: ${details}`);
  }

  return response.json();
}

export async function fetchNotifications({ page = 1, limit = 10, notificationType } = {}) {
  const path = new URL("/notifications", "http://localhost");
  path.searchParams.set("page", String(page));
  path.searchParams.set("limit", String(limit));

  if (notificationType) {
    path.searchParams.set("notification_type", notificationType);
  }

  return request(path.pathname + path.search);
}

export async function fetchPriorityNotifications({ limit = 10, notificationType } = {}) {
  const path = new URL("/notifications/priority", "http://localhost");
  path.searchParams.set("limit", String(limit));

  if (notificationType) {
    path.searchParams.set("notification_type", notificationType);
  }

  return request(path.pathname + path.search);
}
