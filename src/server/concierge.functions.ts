import { createServerFn } from "@tanstack/react-start";
import { ARTICLES, TICKERS, SECTIONS, articlesByCategory, findArticle } from "@/lib/mock";

type Msg = { role: "user" | "assistant" | "system" | "tool"; content: string; tool_call_id?: string; name?: string; tool_calls?: any };

export type PageContext = { path: string; slug?: string };

export type Excerpt = { slug: string; title: string; category: string; snippet: string };

export type Widget =
  | { type: "quote"; symbols: { symbol: string; price: number; change: number }[] }
  | { type: "compare"; symbols: { symbol: string; price: number; change: number; series: number[] }[]; range: string }
  | { type: "articles"; items: { slug: string; title: string; dek: string; category: string }[] }
  | { type: "ticker_chart"; symbol: string; price: number; change: number; series: number[] }
  | { type: "excerpts"; scope: string; items: Excerpt[] };

export type ConciergeReply = { text: string; widgets: Widget[] };


const tools = [
  {
    type: "function",
    function: {
      name: "get_quote",
      description: "Get current price for one or more stock/crypto tickers.",
      parameters: {
        type: "object",
        properties: { symbols: { type: "array", items: { type: "string" } } },
        required: ["symbols"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "compare_tickers",
      description: "Compare price action of 2+ tickers side by side with charts.",
      parameters: {
        type: "object",
        properties: {
          symbols: { type: "array", items: { type: "string" } },
          range: { type: "string", enum: ["1D", "1W", "1M", "3M"], default: "1M" },
        },
        required: ["symbols"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "show_chart",
      description: "Show a price chart for a single ticker.",
      parameters: {
        type: "object",
        properties: { symbol: { type: "string" }, range: { type: "string", default: "1M" } },
        required: ["symbol"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_articles",
      description: "Search ALL published articles on the site by topic/keyword.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_current_page",
      description:
        "Search ONLY the content the user is currently viewing (current section or article). Returns matching excerpts with the query highlighted. Use this whenever the user asks about 'this page', 'this section', 'here', or to find/summarize something on the page they're on.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "Keyword or phrase to find on the current page." } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "summarize_current_page",
      description: "Summarize the content the user is currently viewing (current section or article).",
      parameters: { type: "object", properties: {} },
    },
  },
];

// ----- Page-aware helpers -----
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

function mockSeries(seed: number, len = 30) {
  const out: number[] = [];
  let v = seed;
  for (let i = 0; i < len; i++) {
    v += (Math.sin(i * (seed % 7) * 0.3) + (Math.random() - 0.5)) * (seed * 0.01);
    out.push(Number(v.toFixed(2)));
  }
  return out;
}

function findTicker(sym: string) {
  return TICKERS.find((t) => t.symbol.toUpperCase() === sym.toUpperCase());
}

function runTool(name: string, args: any, page?: PageContext): { result: any; widget?: Widget } {
  if (name === "get_quote") {
    const symbols = (args.symbols ?? []).map((s: string) => findTicker(s)).filter(Boolean) as any[];
    return { result: symbols, widget: { type: "quote", symbols } };
  }
  if (name === "compare_tickers") {
    const symbols = (args.symbols ?? [])
      .map((s: string) => {
        const t = findTicker(s);
        return t ? { ...t, series: mockSeries(t.price) } : null;
      })
      .filter(Boolean) as any[];
    return {
      result: symbols.map((s) => ({ symbol: s.symbol, price: s.price, change: s.change })),
      widget: { type: "compare", symbols, range: args.range ?? "1M" },
    };
  }
  if (name === "show_chart") {
    const t = findTicker(args.symbol);
    if (!t) return { result: { error: "not found" } };
    const widget: Widget = { type: "ticker_chart", ...t, series: mockSeries(t.price) };
    return { result: { ...t }, widget };
  }
  if (name === "search_articles") {
    const q = (args.query ?? "").toLowerCase();
    const items = ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.dek.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q)) ||
        a.category.toLowerCase().includes(q),
    )
      .slice(0, 5)
      .map((a) => ({ slug: a.slug, title: a.title, dek: a.dek, category: a.category }));
    return { result: items, widget: { type: "articles", items } };
  }
  if (name === "search_current_page") {
    const scope = getPageScope(page);
    const items = searchScope(scope.articles, args.query ?? "");
    return {
      result: { scope: scope.label, count: items.length, items },
      widget: { type: "excerpts", scope: scope.label, items },
    };
  }
  if (name === "summarize_current_page") {
    const scope = getPageScope(page);
    const summary = scope.articles.map((a) => ({
      slug: a.slug,
      title: a.title,
      category: a.category,
      dek: a.dek,
      body: a.body.join(" ").slice(0, 600),
    }));
    return { result: { scope: scope.label, articles: summary } };
  }
  return { result: { error: "unknown tool" } };
}

export const conciergeChat = createServerFn({ method: "POST" })
  .inputValidator((d: { messages: Msg[]; page?: PageContext }) => d)
  .handler(async ({ data }): Promise<ConciergeReply> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { text: "AI is not configured.", widgets: [] };

    const scope = getPageScope(data.page);
    const sys = `You are "Concierge", a helpful guide for The Signal — a luxury AI/finance newspaper.
Help readers navigate the site, compare stocks, view charts, find articles, and answer questions about what they're currently reading.
Available tickers: ${TICKERS.map((t) => t.symbol).join(", ")}.

CURRENT PAGE: ${data.page?.path ?? "/"} (scope: ${scope.label}, ${scope.articles.length} article(s) in scope)

Tool routing:
- Stocks/prices/charts → get_quote / compare_tickers / show_chart
- "find articles about X" / general topic across the site → search_articles
- "what does this page say about X", "find X here", "on this page", "in this section" → search_current_page
- "summarize this page/section/article" → summarize_current_page
After tools return, answer in 1-3 concise sentences. The UI renders widgets — don't repeat their contents verbatim.`;

    const convo: Msg[] = [{ role: "system", content: sys }, ...data.messages];
    const widgets: Widget[] = [];

    for (let hop = 0; hop < 3; hop++) {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: convo,
          tools,
          tool_choice: "auto",
        }),
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
      if (calls.length === 0) {
        return { text: msg.content ?? "", widgets };
      }
      convo.push({ role: "assistant", content: msg.content ?? "", tool_calls: calls });
      for (const c of calls) {
        let args: any = {};
        try { args = JSON.parse(c.function.arguments || "{}"); } catch {}
        const { result, widget } = runTool(c.function.name, args, data.page);
        if (widget) widgets.push(widget);
        convo.push({ role: "tool", tool_call_id: c.id, name: c.function.name, content: JSON.stringify(result) });
      }
    }
    return { text: "I've gathered the info above.", widgets };
  });

