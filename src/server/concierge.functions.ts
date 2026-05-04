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
      description: "Search published articles on the site by topic/keyword.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
];

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

function runTool(name: string, args: any): { result: any; widget?: Widget } {
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
  return { result: { error: "unknown tool" } };
}

export const conciergeChat = createServerFn({ method: "POST" })
  .inputValidator((d: { messages: Msg[] }) => d)
  .handler(async ({ data }): Promise<ConciergeReply> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { text: "AI is not configured.", widgets: [] };

    const sys = `You are "Concierge", a helpful guide for The Signal — a luxury AI/finance newspaper. 
Help readers navigate the site, compare stocks, view charts, and find articles.
When the user asks about prices, comparisons, charts, or finding stories, CALL THE APPROPRIATE TOOL.
Available tickers: ${TICKERS.map((t) => t.symbol).join(", ")}.
After tools return, write a concise 1-3 sentence answer. The UI renders the visual widgets.`;

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
        const { result, widget } = runTool(c.function.name, args);
        if (widget) widgets.push(widget);
        convo.push({ role: "tool", tool_call_id: c.id, name: c.function.name, content: JSON.stringify(result) });
      }
    }
    return { text: "I've gathered the info above.", widgets };
  });
