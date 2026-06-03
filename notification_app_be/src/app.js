import { healthRoute } from "./routes/health.route.js";
import { notificationsRoute } from "./routes/notifications.route.js";
import { priorityRoute } from "./routes/priority.route.js";
import { notificationController } from "./controllers/notification.controller.js";

export async function handleRequest(request, response) {
  const handled =
    healthRoute(request, response) ||
    (await notificationsRoute(request, response)) ||
    (await priorityRoute(request, response)) ||
    (await notificationController(request, response));

  if (!handled) {
    response.writeHead(404, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Not Found" }));
  }
}
