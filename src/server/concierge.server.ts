import { ARTICLES, TICKERS, SECTIONS, articlesByCategory, findArticle } from "@/lib/mock";
import { getQuote, getCandles, type Range } from "./finnhub.server";

type Msg = { role: "user" | "assistant" | "system" | "tool"; content: string; tool_call_id?: string; name?: string; tool_calls?: any };

export type PageContext = { path: string; slug?: string };

export type Excerpt = { slug: string; title: string; category: string; snippet: string };

export type ChartSeries = { symbol: string; price: number; change: number; range: Range; times: number[]; values: number[] };

export type Widget =
  | { type: "quote"; symbols: { symbol: string; price: number; change: number }[] }
  | { type: "compare"; symbols: ChartSeries[]; range: Range }
  | { type: "articles"; items: { slug: string; title: string; dek: string; category: string }[] }
  | { type: "ticker_chart"; symbol: string; price: number; change: number; range: Range; times: number[]; values: number[] }
  | { type: "excerpts"; scope: string; query: string; items: Excerpt[] };

export type ConciergeReply = { text: string; widgets: Widget[] };

export type ConciergeInput = { messages: { role: "user" | "assistant"; content: string }[]; page?: PageContext };
export type ChartInput = { symbols: string[]; range: Range };

const RANGES: Range[] = ["1D", "1W", "1M", "3M", "1Y", "5Y"];

const tools = [
  { type: "function", function: { name: "get_quote", description: "Get current live price for one or more stock/crypto tickers (e.g. NVDA, AAPL, BTC, ETH).", parameters: { type: "object", properties: { symbols: { type: "array", items: { type: "string" } } }, required: ["symbols"] } } },
  { type: "function", function: { name: "compare_tickers", description: "Compare price action of 2+ tickers side by side with live charts.", parameters: { type: "object", properties: { symbols: { type: "array", items: { type: "string" } }, range: { type: "string", enum: RANGES, default: "1M" } }, required: ["symbols"] } } },
  { type: "function", function: { name: "show_chart", description: "Show a live price chart for a single ticker.", parameters: { type: "object", properties: { symbol: { type: "string" }, range: { type: "string", enum: RANGES, default: "1M" } }, required: ["symbol"] } } },
  { type: "function", function: { name: "search_articles", description: "Search ALL published articles on the site by topic/keyword.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } } },
  { type: "function", function: { name: "search_current_page", description: "Search ONLY the content the user is currently viewing (current section or article). Returns matching excerpts with the query highlighted.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } } },
  { type: "function", function: { name: "summarize_current_page", description: "Summarize the content the user is currently viewing.", parameters: { type: "object", properties: {} } } },
];

function getPageScope(page?: PageContext) {
  if (!page) return { label: "site", articles: ARTICLES };
  const m = page.path.match(/^\/section\/([^/]+)/);
  if (m) {
    const s = SECTIONS.find((x) => x.slug === m[1]);
    return { label: s ? `the ${s.name} section` : "this section", articles: articlesByCategory(m[1]) };
  }
  const a = page.path.match(/^\/article\/([^/]+)/);
  if (a) {
    const art = findArticle(a[1]);
    return { label: art ? `the article "${art.title}"` : "this article", articles: art ? [art] : [] };
  }
  return { label: "the site", articles: ARTICLES };
}

function makeExcerpt(text: string, q: string, around = 80) {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return null;
  const start = Math.max(0, i - around);
  const end = Math.min(text.length, i + q.length + around);
  return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
}

function searchScope(articles: typeof ARTICLES, q: string): Excerpt[] {
  const out: Excerpt[] = [];
  for (const a of articles) {
    const haystack = [a.title, a.dek, ...a.body].join("\n");
    const snip = makeExcerpt(haystack, q);
    if (snip) out.push({ slug: a.slug, title: a.title, category: a.category, snippet: snip });
  }
  return out.slice(0, 6);
}

async function runTool(name: string, args: any, page?: PageContext): Promise<{ result: any; widget?: Widget }> {
  if (name === "get_quote") {
    const symbols = (args.symbols ?? []) as string[];
    const quotes = (await Promise.all(symbols.map((s) => getQuote(s)))).filter(Boolean) as any[];
    return { result: quotes, widget: { type: "quote", symbols: quotes } };
  }
  if (name === "compare_tickers") {
    const range = (RANGES.includes(args.range) ? args.range : "1M") as Range;
    const symbols = (args.symbols ?? []) as string[];
    const series = (await Promise.all(symbols.map(async (s) => {
      const [q, c] = await Promise.all([getQuote(s), getCandles(s, range)]);
      if (!q || !c) return null;
      return { symbol: q.symbol, price: q.price, change: q.change, range, times: c.times, values: c.values } as ChartSeries;
    }))).filter(Boolean) as ChartSeries[];
    return { result: series.map((s) => ({ symbol: s.symbol, price: s.price, change: s.change, points: s.values.length })), widget: { type: "compare", symbols: series, range } };
  }
  if (name === "show_chart") {
    const range = (RANGES.includes(args.range) ? args.range : "1M") as Range;
    const [q, c] = await Promise.all([getQuote(args.symbol), getCandles(args.symbol, range)]);
    if (!q || !c) return { result: { error: "not found" } };
    const widget: Widget = { type: "ticker_chart", symbol: q.symbol, price: q.price, change: q.change, range, times: c.times, values: c.values };
    return { result: { ...q, points: c.values.length, range }, widget };
  }
  if (name === "search_articles") {
    const q = String(args.query ?? "").toLowerCase();
    const items = ARTICLES.filter((a) => a.title.toLowerCase().includes(q) || a.dek.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q)) || a.category.toLowerCase().includes(q)).slice(0, 5).map((a) => ({ slug: a.slug, title: a.title, dek: a.dek, category: a.category }));
    return { result: items, widget: { type: "articles", items } };
  }
  if (name === "search_current_page") {
    const scope = getPageScope(page);
    const query = String(args.query ?? "");
    const items = searchScope(scope.articles, query);
    return { result: { scope: scope.label, count: items.length, items }, widget: { type: "excerpts", scope: scope.label, query, items } };
  }
  if (name === "summarize_current_page") {
    const scope = getPageScope(page);
    const summary = scope.articles.map((a) => ({ slug: a.slug, title: a.title, category: a.category, dek: a.dek, body: a.body.join(" ").slice(0, 600) }));
    return { result: { scope: scope.label, articles: summary } };
  }
  return { result: { error: "unknown tool" } };
}

export async function runConciergeChat(data: ConciergeInput): Promise<ConciergeReply> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return { text: "AI is not configured.", widgets: [] };

  const scope = getPageScope(data.page);
  const sys = `You are "Concierge", a helpful guide for The Signal — a luxury AI/finance newspaper.
Help readers compare stocks, view live charts, find articles, and answer questions about what they're reading.
Live market data comes from Finnhub. Featured tickers: ${TICKERS.map((t) => t.symbol).join(", ")}. Crypto symbols supported: BTC, ETH, SOL, DOGE, XRP.
Default chart range is 1M unless the user specifies one of: ${RANGES.join(", ")}.

CURRENT PAGE: ${data.page?.path ?? "/"} (scope: ${scope.label}, ${scope.articles.length} article(s) in scope)

Tool routing:
- Stocks/prices/charts → get_quote / compare_tickers / show_chart
- "find articles about X" → search_articles
- "what does this page say about X" → search_current_page
- "summarize this page/section/article" → summarize_current_page
After tools return, answer in 1-3 concise sentences. The UI renders widgets — don't repeat their contents verbatim.`;

  const convo: Msg[] = [{ role: "system", content: sys }, ...data.messages];
  const widgets: Widget[] = [];

  for (let hop = 0; hop < 3; hop++) {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: convo, tools, tool_choice: "auto" }),
    });
    if (!res.ok) {
      if (res.status === 429) return { text: "Rate limit reached. Try again in a moment.", widgets };
      if (res.status === 402) return { text: "AI credits exhausted. Add credits in Workspace settings.", widgets };
      return { text: `AI error (${res.status}).`, widgets };
    }
    const json = await res.json();
    const msg = json.choices?.[0]?.message;
    if (!msg) return { text: "No response.", widgets };
    const calls = msg.tool_calls ?? [];
    if (calls.length === 0) return { text: msg.content ?? "", widgets };
    convo.push({ role: "assistant", content: msg.content ?? "", tool_calls: calls });
    for (const c of calls) {
      let args: any = {};
      try { args = JSON.parse(c.function.arguments || "{}"); } catch {}
      try {
        const { result, widget } = await runTool(c.function.name, args, data.page);
        if (widget) widgets.push(widget);
        convo.push({ role: "tool", tool_call_id: c.id, name: c.function.name, content: JSON.stringify(result) });
      } catch (e: any) {
        convo.push({ role: "tool", tool_call_id: c.id, name: c.function.name, content: JSON.stringify({ error: e?.message ?? "tool failed" }) });
      }
    }
  }
  return { text: "I've gathered the info above.", widgets };
}

export async function fetchChartSeries(data: ChartInput): Promise<ChartSeries[]> {
  const range = (RANGES.includes(data.range) ? data.range : "1M") as Range;
  const out = await Promise.all(data.symbols.map(async (s) => {
    const [q, c] = await Promise.all([getQuote(s), getCandles(s, range)]);
    if (!q || !c) return null;
    return { symbol: q.symbol, price: q.price, change: q.change, range, times: c.times, values: c.values } as ChartSeries;
  }));
  return out.filter(Boolean) as ChartSeries[];
}
