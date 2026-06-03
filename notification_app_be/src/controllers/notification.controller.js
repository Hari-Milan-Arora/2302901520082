import { createNotification } from "../services/notification.service.js";

export async function notificationController(request, response) {
  if (request.method !== "POST" || request.url !== "/notifications") {
    return false;
  }

  const body = await readJsonBody(request);
  const notification = await createNotification(body);

  response.writeHead(201, { "Content-Type": "application/json" });
  response.end(JSON.stringify(notification));
  return true;
}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}
