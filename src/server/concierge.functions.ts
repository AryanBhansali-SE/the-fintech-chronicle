// Re-exports shared types. Network calls now go through /api/public/concierge
// and /api/public/concierge-chart to bypass the preview-host auth gate that
// was intercepting /_serverFn/* with a 302 redirect.
export type {
  Widget,
  ChartSeries,
  ConciergeReply,
  ConciergeInput,
  ChartInput,
  Excerpt,
  PageContext,
} from "./concierge.server";
