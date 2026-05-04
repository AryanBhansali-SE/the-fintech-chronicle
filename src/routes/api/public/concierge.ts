import { createFileRoute } from "@tanstack/react-router";
import { runConciergeChat, type ConciergeInput } from "@/server/concierge.server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

export const Route = createFileRoute("/api/public/concierge")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as ConciergeInput;
          if (!body || !Array.isArray(body.messages)) {
            return new Response(JSON.stringify({ error: "invalid body" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...CORS },
            });
          }
          const reply = await runConciergeChat(body);
          return new Response(JSON.stringify(reply), {
            status: 200,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        } catch (e: any) {
          return new Response(
            JSON.stringify({ text: "Concierge error.", widgets: [], error: e?.message ?? "unknown" }),
            { status: 500, headers: { "Content-Type": "application/json", ...CORS } },
          );
        }
      },
    },
  },
});
