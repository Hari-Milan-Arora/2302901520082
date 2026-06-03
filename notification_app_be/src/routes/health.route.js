export function healthRoute(request, response) {
  if (request.method !== "GET" || request.url !== "/health") {
    return false;
  }

  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ ok: true, service: "notification_app_be" }));
  return true;
}
