const DEFAULT_NOTIFICATION_API_URL = "http://4.224.186.213/evaluation-service/notifications";

const TYPE_WEIGHTS = {
  placement: 3,
  result: 2,
  event: 1,
};

export async function getPriorityNotifications({
  topN = 10,
  pageSize = 100,
  notificationType,
  authHeader,
  apiUrl = process.env.NOTIFICATION_API_URL ?? DEFAULT_NOTIFICATION_API_URL,
} = {}) {
  const heap = new MinHeap(comparePriority);
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const pageData = await fetchNotificationsPage({
      apiUrl,
      page,
      limit: pageSize,
      notificationType,
      authHeader,
    });

    const notifications = extractNotifications(pageData);
    if (notifications.length === 0) {
      hasMore = false;
      break;
    }

    for (const notification of notifications) {
      heap.push(normalizeNotification(notification));
      if (heap.size() > topN) {
        heap.pop();
      }
    }

    if (notifications.length < pageSize) {
      hasMore = false;
    } else {
      page += 1;
    }
  }

  return heap.toArraySortedDescending();
}

async function fetchNotificationsPage({ apiUrl, page, limit, notificationType, authHeader }) {
  const url = new URL(apiUrl);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));

  if (notificationType) {
    url.searchParams.set("notification_type", notificationType);
  }

  const headers = {
    Accept: "application/json",
  };

  const resolvedAuth = resolveAuthHeader(authHeader);
  if (resolvedAuth) {
    headers.Authorization = resolvedAuth;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Notification API request failed with ${response.status}: ${details}`);
  }

  return response.json();
}

function extractNotifications(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.notifications)) {
    return payload.notifications;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

function normalizeNotification(notification) {
  const rawType = String(notification?.Type ?? notification?.type ?? notification?.notificationType ?? "").trim();
  const type = rawType.toLowerCase();
  const timestampValue = notification?.Timestamp ?? notification?.timestamp ?? notification?.createdAt ?? new Date().toISOString();
  const timestamp = new Date(timestampValue).getTime();

  return {
    id: notification?.ID ?? notification?.id ?? crypto.randomUUID(),
    type: rawType || "Unknown",
    message: notification?.Message ?? notification?.message ?? "",
    timestamp: Number.isFinite(timestamp) ? timestamp : 0,
    weight: TYPE_WEIGHTS[type] ?? 0,
    raw: notification,
  };
}

function comparePriority(a, b) {
  if (a.weight !== b.weight) return a.weight - b.weight;
  if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
  return String(b.id).localeCompare(String(a.id));
}

function resolveAuthHeader(authHeader) {
  if (typeof authHeader === "string" && authHeader.trim()) {
    return authHeader.trim();
  }

  const direct = process.env.NOTIFICATION_API_AUTH_HEADER?.trim();
  if (direct) return direct;

  const token = process.env.NOTIFICATION_API_AUTH_TOKEN?.trim();
  if (token) return token.startsWith("Bearer ") ? token : `Bearer ${token}`;

  const fallback = process.env.LOG_API_AUTH_HEADER?.trim();
  if (fallback) return fallback;

  return null;
}

class MinHeap {
  constructor(compare) {
    this.compare = compare;
    this.items = [];
  }

  size() {
    return this.items.length;
  }

  push(value) {
    this.items.push(value);
    this.bubbleUp(this.items.length - 1);
  }

  pop() {
    if (this.items.length === 0) {
      return null;
    }

    const top = this.items[0];
    const last = this.items.pop();

    if (this.items.length > 0 && last !== undefined) {
      this.items[0] = last;
      this.bubbleDown(0);
    }

    return top;
  }

  toArraySortedDescending() {
    return [...this.items]
      .sort((a, b) => comparePriority(b, a))
      .map((item) => item.raw);
  }

  bubbleUp(index) {
    let current = index;
    while (current > 0) {
      const parent = Math.floor((current - 1) / 2);
      if (this.compare(this.items[current], this.items[parent]) >= 0) {
        break;
      }
      [this.items[current], this.items[parent]] = [this.items[parent], this.items[current]];
      current = parent;
    }
  }

  bubbleDown(index) {
    let current = index;

    while (true) {
      const left = current * 2 + 1;
      const right = current * 2 + 2;
      let smallest = current;

      if (left < this.items.length && this.compare(this.items[left], this.items[smallest]) < 0) {
        smallest = left;
      }

      if (right < this.items.length && this.compare(this.items[right], this.items[smallest]) < 0) {
        smallest = right;
      }

      if (smallest === current) {
        break;
      }

      [this.items[current], this.items[smallest]] = [this.items[smallest], this.items[current]];
      current = smallest;
    }
  }
}
