import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { AI_EVENTS, TICKERS } from "@/lib/mock";

export const Route = createFileRoute("/terminal")({
  component: Terminal,
  head: () => ({
    meta: [
      { title: "Trading Terminal — The Signal" },
      {
        name: "description",
        content: "Correlate AI breakthroughs with market movements in real time.",
      },
    ],
  }),
});

function Sparkline({ symbol, highlight }: { symbol: string; highlight: number | null }) {
  // Deterministic mock series per symbol
  const data = useMemo(() => {
    let seed = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    const arr: number[] = [];
    let v = 100;
    for (let i = 0; i < 60; i++) {
      v += (rand() - 0.5) * 4;
      arr.push(v);
    }
    return arr;
  }, [symbol]);

  const min = Math.min(...data);
  const max = Math.max(...data);
  const w = 600;
  const h = 220;
  const path = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / (max - min)) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[220px]">
      <path d={path} fill="none" stroke="currentColor" strokeWidth={1.5} />
      {highlight !== null && (
        <line
          x1={(highlight / data.length) * w}
          x2={(highlight / data.length) * w}
          y1={0}
          y2={h}
          stroke="var(--color-alert)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      )}
    </svg>
  );
}

function Terminal() {
  const [symbol, setSymbol] = useState("NVDA");
  const [hoveredEvent, setHoveredEvent] = useState<number | null>(null);

  const symbols = TICKERS.filter((t) => !["BTC", "ETH"].includes(t.symbol));

  return (
    <Layout>
      <div className="mx-auto max-w-[1400px] px-6 py-10">
        <header className="rule-bottom pb-6">
          <p className="smallcaps text-xs text-alert font-bold">● Live Terminal</p>
          <h1 className="font-serif text-5xl font-black mt-2">Trading Terminal</h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Correlations between AI breakthroughs and market movements. Hover an event to mark its
            position on the price series.
          </p>
        </header>

        <div className="mt-8 grid lg:grid-cols-[320px_1fr] gap-8">
          {/* Left: events timeline */}
          <aside className="border-r border-foreground/20 pr-6">
            <h3 className="smallcaps text-xs text-muted-foreground mb-3">AI Events</h3>
            <ol className="space-y-3">
              {AI_EVENTS.map((e, i) => (
                <motion.li
                  key={e.title}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onMouseEnter={() => setHoveredEvent(40 + i * 4)}
                  onMouseLeave={() => setHoveredEvent(null)}
                  className="border-l-2 border-foreground pl-3 cursor-pointer hover:border-alert transition-colors"
                >
                  <p className="font-mono text-xs text-muted-foreground">{e.date}</p>
                  <p className="font-serif text-base font-bold leading-tight mt-0.5">{e.title}</p>
                  <p className="text-xs text-alert mt-0.5">{e.impact}</p>
                </motion.li>
              ))}
            </ol>
          </aside>

          {/* Right: chart */}
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              {symbols.map((t) => {
                const active = t.symbol === symbol;
                return (
                  <button
                    key={t.symbol}
                    onClick={() => setSymbol(t.symbol)}
                    className={`font-mono text-sm px-3 py-1.5 border transition-colors ${
                      active
                        ? "bg-ink text-paper border-ink"
                        : "border-foreground/30 hover:border-foreground"
                    }`}
                  >
                    {t.symbol}
                  </button>
                );
              })}
            </div>
            <div className="border border-foreground/20 p-6 bg-card">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <p className="font-serif text-4xl font-black">{symbol}</p>
                  <p className="font-mono text-sm text-muted-foreground">
                    {TICKERS.find((t) => t.symbol === symbol)?.price.toLocaleString()}
                  </p>
                </div>
                <p className="text-xs smallcaps text-muted-foreground">60-day series · mock</p>
              </div>
              <Sparkline symbol={symbol} highlight={hoveredEvent} />
              <p className="mt-4 text-xs text-muted-foreground">
                Correlation (last 30d, AI event sentiment vs. {symbol} return):{" "}
                <span className="font-mono text-foreground">+0.42</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
