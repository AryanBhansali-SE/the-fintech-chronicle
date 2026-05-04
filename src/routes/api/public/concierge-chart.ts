import { createFileRoute } from "@tanstack/react-router";
import { fetchChartSeries, type ChartInput } from "@/server/concierge.server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

export const Route = createFileRoute("/api/public/concierge-chart")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as ChartInput;
          if (!body || !Array.isArray(body.symbols) || typeof body.range !== "string") {
            return new Response(JSON.stringify({ error: "invalid body" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...CORS },
            });
          }
          const series = await fetchChartSeries(body);
          return new Response(JSON.stringify(series), {
            status: 200,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e?.message ?? "unknown" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        }
      },
    },
  },
});
