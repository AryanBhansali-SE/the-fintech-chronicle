import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { conciergeChat, fetchChart, type Widget, type ChartSeries } from "@/server/concierge.functions";

type Range = "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y";
const RANGES: Range[] = ["1D", "1W", "1M", "3M", "1Y", "5Y"];

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

// ---- indicator helpers ----
function sma(values: number[], period: number) {
  const out: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    out.push(i >= period - 1 ? sum / period : null);
  }
  return out;
}
function ema(values: number[], period: number) {
  const out: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prev: number | null = null;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) { out.push(null); continue; }
    if (prev === null) {
      const seed = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
      prev = seed;
    } else {
      prev = values[i] * k + prev * (1 - k);
    }
    out.push(prev);
  }
  return out;
}
function rsi(values: number[], period = 14) {
  const out: (number | null)[] = [null];
  let gains = 0, losses = 0;
  for (let i = 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    if (i <= period) {
      if (d >= 0) gains += d; else losses -= d;
      if (i === period) {
        const rs = gains / (losses || 1e-9);
        out.push(100 - 100 / (1 + rs));
      } else out.push(null);
    } else {
      const g = d > 0 ? d : 0;
      const l = d < 0 ? -d : 0;
      gains = (gains * (period - 1) + g) / period;
      losses = (losses * (period - 1) + l) / period;
      const rs = gains / (losses || 1e-9);
      out.push(100 - 100 / (1 + rs));
    }
  }
  return out;
}

type Indicator = "SMA20" | "EMA50" | "RSI14";

function polyline(values: (number | null)[], min: number, range: number, w = 100, h = 60) {
  const pts: string[] = [];
  values.forEach((v, i) => {
    if (v === null) return;
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 2) - 1;
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  });
  return pts.join(" ");
}

function downloadCSV(series: ChartSeries[]) {
  const maxLen = Math.max(...series.map((s) => s.values.length));
  const header = ["time_iso", ...series.map((s) => s.symbol)].join(",");
  const rows: string[] = [header];
  for (let i = 0; i < maxLen; i++) {
    const t = series[0]?.times[i] ? new Date(series[0].times[i] * 1000).toISOString() : "";
    rows.push([t, ...series.map((s) => (s.values[i] ?? "").toString())].join(","));
  }
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${series.map((s) => s.symbol).join("-")}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function downloadPNG(svg: SVGSVGElement | null, name: string) {
  if (!svg) return;
  const xml = new XMLSerializer().serializeToString(svg);
  const svg64 = btoa(unescape(encodeURIComponent(xml)));
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200; canvas.height = 600;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((b) => {
      if (!b) return;
      const url = URL.createObjectURL(b);
      const a = document.createElement("a");
      a.href = url; a.download = `${name}.png`; a.click();
      URL.revokeObjectURL(url);
    });
  };
  img.src = `data:image/svg+xml;base64,${svg64}`;
}

function ChartWidget({ initial, initialRange }: { initial: ChartSeries[]; initialRange: Range }) {
  const [series, setSeries] = useState<ChartSeries[]>(initial);
  const [range, setRange] = useState<Range>(initialRange);
  const [loading, setLoading] = useState(false);
  const [indicators, setIndicators] = useState<Set<Indicator>>(new Set());
  const [compareInput, setCompareInput] = useState("");
  const [normalize, setNormalize] = useState(series.length > 1);
  const svgRef = useRef<SVGSVGElement>(null);
  const fetchFn = useServerFn(fetchChart);

  const reload = async (next: { symbols?: string[]; range?: Range }) => {
    const symbols = next.symbols ?? series.map((s) => s.symbol);
    const r = next.range ?? range;
    setLoading(true);
    try {
      const data = await fetchFn({ data: { symbols, range: r } });
      if (data.length) { setSeries(data); setRange(r); }
    } finally { setLoading(false); }
  };

  const addCompare = async () => {
    const sym = compareInput.trim().toUpperCase();
    if (!sym) return;
    setCompareInput("");
    setNormalize(true);
    await reload({ symbols: [...series.map((s) => s.symbol), sym] });
  };
  const removeSym = (sym: string) => {
    if (series.length <= 1) return;
    reload({ symbols: series.filter((s) => s.symbol !== sym).map((s) => s.symbol) });
  };

  const toggleInd = (k: Indicator) => {
    setIndicators((prev) => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });
  };

  // build display series (normalize to % change if compare)
  const display = useMemo(() => {
    return series.map((s) => {
      if (!normalize) return { ...s, plot: s.values };
      const base = s.values[0] || 1;
      return { ...s, plot: s.values.map((v) => ((v - base) / base) * 100) };
    });
  }, [series, normalize]);

  const allVals = display.flatMap((s) => s.plot);
  const min = Math.min(...allVals);
  const max = Math.max(...allVals);
  const span = max - min || 1;
  const colors = ["hsl(var(--foreground))", "hsl(var(--alert))", "#1a73e8", "#9b59b6"];

  return (
    <div className="border border-foreground/20 p-3 my-2 bg-background">
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {series.length > 1 ? "Compare" : "Chart"} · {range} {normalize ? "· %Δ" : ""}
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => reload({ range: r })}
              disabled={loading}
              className={`text-[10px] px-1.5 py-0.5 border ${r === range ? "bg-foreground text-background border-foreground" : "border-foreground/20 hover:border-foreground/60"}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* symbols header */}
      <div className="flex flex-wrap gap-2 mb-2">
        {display.map((s, i) => (
          <div key={s.symbol} className="flex items-center gap-1 font-mono text-xs">
            <span style={{ color: colors[i % colors.length] }}>■</span>
            <span className="font-bold">{s.symbol}</span>
            <span>${s.price.toFixed(2)}</span>
            <span className={s.change >= 0 ? "" : "text-[hsl(var(--alert))]"}>
              ({s.change >= 0 ? "+" : ""}{s.change}%)
            </span>
            {series.length > 1 && (
              <button onClick={() => removeSym(s.symbol)} className="text-muted-foreground hover:text-foreground">×</button>
            )}
          </div>
        ))}
      </div>

      {/* main chart */}
      <svg ref={svgRef} viewBox="0 0 100 60" className="w-full h-32" preserveAspectRatio="none">
        {display.map((s, i) => (
          <polyline key={s.symbol} fill="none" stroke={colors[i % colors.length]} strokeWidth="0.7"
            points={polyline(s.plot, min, span)} />
        ))}
        {/* indicators only on first symbol, only when not normalized */}
        {!normalize && series[0] && indicators.has("SMA20") && (
          <polyline fill="none" stroke="#f5a623" strokeWidth="0.5" strokeDasharray="1,1"
            points={polyline(sma(series[0].values, 20), min, span)} />
        )}
        {!normalize && series[0] && indicators.has("EMA50") && (
          <polyline fill="none" stroke="#16a085" strokeWidth="0.5" strokeDasharray="2,1"
            points={polyline(ema(series[0].values, 50), min, span)} />
        )}
      </svg>

      {/* RSI panel */}
      {!normalize && series[0] && indicators.has("RSI14") && (() => {
        const r = rsi(series[0].values, 14);
        return (
          <svg viewBox="0 0 100 30" className="w-full h-12 mt-1 border-t border-foreground/10" preserveAspectRatio="none">
            <line x1="0" x2="100" y1={30 - (70 / 100) * 30} y2={30 - (70 / 100) * 30} stroke="hsl(var(--alert))" strokeWidth="0.2" strokeDasharray="1,1" />
            <line x1="0" x2="100" y1={30 - (30 / 100) * 30} y2={30 - (30 / 100) * 30} stroke="hsl(var(--alert))" strokeWidth="0.2" strokeDasharray="1,1" />
            <polyline fill="none" stroke="#9b59b6" strokeWidth="0.6" points={polyline(r, 0, 100, 100, 30)} />
          </svg>
        );
      })()}

      {/* controls */}
      <div className="mt-2 flex flex-wrap items-center gap-1 text-[10px]">
        {(["SMA20", "EMA50", "RSI14"] as Indicator[]).map((k) => (
          <button key={k} onClick={() => toggleInd(k)}
            className={`px-1.5 py-0.5 border ${indicators.has(k) ? "bg-foreground text-background border-foreground" : "border-foreground/20 hover:border-foreground/60"}`}>
            {k}
          </button>
        ))}
        <span className="mx-1 text-muted-foreground">|</span>
        <button onClick={() => setNormalize((n) => !n)}
          className={`px-1.5 py-0.5 border ${normalize ? "bg-foreground text-background border-foreground" : "border-foreground/20 hover:border-foreground/60"}`}>
          %Δ
        </button>
        <span className="mx-1 text-muted-foreground">|</span>
        <button onClick={() => downloadPNG(svgRef.current, series.map((s) => s.symbol).join("-"))}
          className="px-1.5 py-0.5 border border-foreground/20 hover:border-foreground/60">PNG</button>
        <button onClick={() => downloadCSV(series)}
          className="px-1.5 py-0.5 border border-foreground/20 hover:border-foreground/60">CSV</button>
      </div>

      {/* compare input */}
      <div className="mt-2 flex gap-1">
        <input
          value={compareInput}
          onChange={(e) => setCompareInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCompare()}
          placeholder="Add symbol (e.g. MSFT, BTC)…"
          className="flex-1 bg-transparent border border-foreground/20 px-2 py-1 text-xs font-mono focus:outline-none focus:border-foreground"
        />
        <button onClick={addCompare} disabled={loading}
          className="bg-foreground text-background px-2 text-[10px] uppercase tracking-widest disabled:opacity-50">Add</button>
      </div>
      {loading && <div className="mt-1 text-[10px] text-muted-foreground italic">loading…</div>}
    </div>
  );
}

function WidgetView({ w }: { w: Widget }) {
  if (w.type === "quote")
    return (
      <div className="border border-foreground/20 p-3 my-2 bg-background">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Live Quotes</div>
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
  if (w.type === "ticker_chart") {
    const series: ChartSeries = { symbol: w.symbol, price: w.price, change: w.change, range: w.range, times: w.times, values: w.values };
    return <ChartWidget initial={[series]} initialRange={w.range} />;
  }
  if (w.type === "compare") return <ChartWidget initial={w.symbols} initialRange={w.range} />;
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
    { role: "assistant", text: "I'm your reading concierge. Ask me to compare tickers, show a live chart, or find articles." },
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
    } catch {
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
    <div className="fixed bottom-6 right-6 z-50 w-[min(92vw,420px)] h-[min(85vh,640px)] bg-background border border-foreground/30 shadow-2xl flex flex-col">
      <div className="flex items-center justify-between border-b border-foreground/20 px-3 py-2">
        <div>
          <div className="font-serif text-sm">Concierge</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Reading: <span className="text-foreground">{pathname}</span>
          </div>
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
          placeholder="Compare NVDA and MSFT, 1Y…"
          className="flex-1 bg-transparent border border-foreground/20 px-2 py-1.5 text-sm focus:outline-none focus:border-foreground"
        />
        <button onClick={send} disabled={loading} className="bg-foreground text-background px-3 text-xs uppercase tracking-widest disabled:opacity-50">
          Send
        </button>
      </div>
    </div>
  );
}
