import { getPriorityNotifications } from "../services/priorityInbox.service.js";

export async function priorityRoute(request, response) {
  if (request.method !== "GET" || !request.url.startsWith("/notifications/priority")) {
    return false;
  }

  const url = new URL(request.url, "http://localhost");
  const topN = Number(url.searchParams.get("limit") ?? url.searchParams.get("top_n") ?? 10);
  const pageSize = Number(url.searchParams.get("page_size") ?? 100);
  const notificationType = url.searchParams.get("notification_type") ?? undefined;

  const result = await getPriorityNotifications({
    topN: Number.isFinite(topN) && topN > 0 ? topN : 10,
    pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 100,
    notificationType,
  });

  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify(result));
  return true;
}
