import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { conciergeChat, type Widget } from "@/server/concierge.functions";

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
  const parts = text.split(re);
  return (
    <>
      {parts.map((p, i) =>
        re.test(p) ? (
          <mark key={i} className="bg-[hsl(var(--alert))]/15 text-foreground px-0.5">{p}</mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}


type Turn = { role: "user" | "assistant"; text: string; widgets?: Widget[] };

function Sparkline({ data, color = "currentColor" }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const r = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${30 - ((v - min) / r) * 28}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" className="w-full h-10" preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="1.2" points={pts} />
    </svg>
  );
}

function WidgetView({ w }: { w: Widget }) {
  if (w.type === "quote")
    return (
      <div className="border border-foreground/20 p-3 my-2 bg-background">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Quotes</div>
        <div className="grid grid-cols-2 gap-2">
          {w.symbols.map((s) => (
            <div key={s.symbol} className="flex justify-between font-mono text-sm">
              <span className="font-bold">{s.symbol}</span>
              <span>${s.price.toFixed(2)}</span>
              <span className={s.change >= 0 ? "text-foreground" : "text-[hsl(var(--alert))]"}>
                {s.change >= 0 ? "+" : ""}{s.change}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  if (w.type === "ticker_chart")
    return (
      <div className="border border-foreground/20 p-3 my-2 bg-background">
        <div className="flex justify-between items-baseline mb-1">
          <span className="font-bold font-mono">{w.symbol}</span>
          <span className="font-mono text-sm">${w.price.toFixed(2)} <span className={w.change >= 0 ? "" : "text-[hsl(var(--alert))]"}>({w.change >= 0 ? "+" : ""}{w.change}%)</span></span>
        </div>
        <Sparkline data={w.series} color={w.change >= 0 ? "currentColor" : "#D32F2F"} />
      </div>
    );
  if (w.type === "compare")
    return (
      <div className="border border-foreground/20 p-3 my-2 bg-background">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Compare · {w.range}</div>
        <div className="space-y-3">
          {w.symbols.map((s) => (
            <div key={s.symbol}>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="font-bold">{s.symbol}</span>
                <span>${s.price.toFixed(2)} <span className={s.change >= 0 ? "" : "text-[hsl(var(--alert))]"}>({s.change >= 0 ? "+" : ""}{s.change}%)</span></span>
              </div>
              <Sparkline data={s.series} color={s.change >= 0 ? "currentColor" : "#D32F2F"} />
            </div>
          ))}
        </div>
      </div>
    );
  if (w.type === "articles")
    return (
      <div className="border border-foreground/20 p-3 my-2 bg-background">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Articles</div>
        <ul className="space-y-2">
          {w.items.map((a) => (
            <li key={a.slug}>
              <Link to="/article/$slug" params={{ slug: a.slug }} className="block hover:underline">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{a.category}</div>
                <div className="font-serif text-sm leading-tight">{a.title}</div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  if (w.type === "excerpts") {
    return (
      <div className="border border-foreground/20 p-3 my-2 bg-background">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
          From {w.scope} · {w.items.length} match{w.items.length === 1 ? "" : "es"}
        </div>
        {w.items.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No matches on this page.</p>
        ) : (
          <ul className="space-y-3">
            {w.items.map((a) => (
              <li key={a.slug} className="border-l-2 border-[hsl(var(--alert))] pl-2">
                <Link to="/article/$slug" params={{ slug: a.slug }} className="block hover:underline">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{a.category}</div>
                  <div className="font-serif text-sm leading-tight">{a.title}</div>
                </Link>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  <Highlight text={a.snippet} query={w.query} />
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
  return null;
}

export function Concierge() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([
    { role: "assistant", text: "I'm your reading concierge. Ask me to compare tickers, show a chart, or find articles." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chat = useServerFn(conciergeChat);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const page = useMemo(() => {
    const sec = pathname.match(/^\/section\/([^/]+)/);
    const art = pathname.match(/^\/article\/([^/]+)/);
    return { path: pathname, slug: sec?.[1] ?? art?.[1] };
  }, [pathname]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 9e9 }); }, [turns, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: Turn[] = [...turns, { role: "user", text }];
    setTurns(next);
    setInput("");
    setLoading(true);
    try {
      const reply = await chat({
        data: { messages: next.map((t) => ({ role: t.role, content: t.text })), page },
      });
      setTurns([...next, { role: "assistant", text: reply.text, widgets: reply.widgets }]);
    } catch (e: any) {
      setTurns([...next, { role: "assistant", text: "Something went wrong. Try again." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-foreground text-background px-4 py-3 font-mono text-xs uppercase tracking-widest shadow-lg hover:opacity-90"
      >
        Ask Concierge
      </button>
    );

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[min(92vw,380px)] h-[min(80vh,560px)] bg-background border border-foreground/30 shadow-2xl flex flex-col">
      <div className="flex items-center justify-between border-b border-foreground/20 px-3 py-2">
        <div>
          <div className="font-serif text-sm">Concierge</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Reader Assistant</div>
        </div>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 text-sm">
        {turns.map((t, i) => (
          <div key={i} className={`my-2 ${t.role === "user" ? "text-right" : ""}`}>
            <div className={`inline-block max-w-full ${t.role === "user" ? "bg-foreground text-background px-3 py-1.5" : ""}`}>
              {t.text}
            </div>
            {t.widgets?.map((w, j) => <WidgetView key={j} w={w} />)}
          </div>
        ))}
        {loading && <div className="text-xs text-muted-foreground italic">thinking…</div>}
      </div>
      <div className="border-t border-foreground/20 p-2 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Compare NVDA and MSFT…"
          className="flex-1 bg-transparent border border-foreground/20 px-2 py-1.5 text-sm focus:outline-none focus:border-foreground"
        />
        <button onClick={send} disabled={loading} className="bg-foreground text-background px-3 text-xs uppercase tracking-widest disabled:opacity-50">
          Send
        </button>
      </div>
    </div>
  );
}
