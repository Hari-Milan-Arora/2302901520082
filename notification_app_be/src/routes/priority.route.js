import { getPriorityNotifications } from "../services/priorityInbox.service.js";

export async function priorityRoute(request, response) {
  if (request.method !== "GET" || !request.url.startsWith("/notifications/priority")) {
    return false;
  }

  const url = new URL(request.url, "http://localhost");
  const topN = Number(url.searchParams.get("limit") ?? 10);
  const notificationType = url.searchParams.get("notification_type") ?? undefined;

  const notifications = await getPriorityNotifications({
    topN: Number.isFinite(topN) && topN > 0 ? topN : 10,
    notificationType,
  });

  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ notifications }));
  return true;
}
