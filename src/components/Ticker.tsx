import { TICKERS } from "@/lib/mock";

export function Ticker() {
  const items = [...TICKERS, ...TICKERS];
  return (
    <div className="bg-ink text-paper overflow-hidden border-y border-foreground/20">
      <div className="flex items-center">
        <span className="shrink-0 px-4 py-2 bg-alert text-alert-foreground text-xs smallcaps font-bold">
          ● Live
        </span>
        <div className="flex-1 overflow-hidden">
          <div className="flex animate-ticker whitespace-nowrap py-2">
            {items.map((t, i) => {
              const up = t.change >= 0;
              return (
                <span
                  key={i}
                  className="font-mono text-sm px-6 inline-flex items-center gap-2"
                >
                  <span className="font-bold">{t.symbol}</span>
                  <span>{t.price.toLocaleString()}</span>
                  <span className={up ? "text-emerald-400" : "text-alert"}>
                    {up ? "▲" : "▼"} {Math.abs(t.change).toFixed(2)}%
                  </span>
                  <span className="text-paper/30">|</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
