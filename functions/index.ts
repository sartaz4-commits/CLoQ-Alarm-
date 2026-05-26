export { Registry } from "./registry";

type Env = { DO: Fetcher };

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const REGISTRY_ROUTES = new Set<string>([
  "/register",
  "/profile",
  "/friends",
  "/add-friend",
  "/remove-friend",
  "/nudge",
  "/wake-request",
  "/wake-respond",
]);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (url.pathname === "/ping") {
      return Response.json({ ok: true, now: new Date().toISOString() }, { headers: CORS });
    }

    if (REGISTRY_ROUTES.has(url.pathname)) {
      const wrapped = new Request(request.url, request);
      wrapped.headers.set("X-Rork-DO-Class", "Registry");
      wrapped.headers.set("X-Rork-DO-Id", "global");
      return env.DO.fetch(wrapped);
    }

    return new Response(JSON.stringify({ error: "not found" }), {
      status: 404,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  },
} satisfies ExportedHandler<Env>;
