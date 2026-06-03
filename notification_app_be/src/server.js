import http from "node:http";
import { PORT } from "./config/env.js";
import { handleRequest } from "./app.js";

const server = http.createServer((request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  handleRequest(request, response).catch((error) => {
    console.error(error);
    response.writeHead(500, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Internal Server Error" }));
  });
});

server.listen(PORT, () => {
  console.log(`notification_app_be listening on http://localhost:${PORT}`);
});
