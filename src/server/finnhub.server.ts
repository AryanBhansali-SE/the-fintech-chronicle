// Finnhub API helpers — server-only.
// Docs: https://finnhub.io/docs/api

const BASE = "https://finnhub.io/api/v1";

const CRYPTO_MAP: Record<string, string> = {
  BTC: "BINANCE:BTCUSDT",
  ETH: "BINANCE:ETHUSDT",
  SOL: "BINANCE:SOLUSDT",
  DOGE: "BINANCE:DOGEUSDT",
  XRP: "BINANCE:XRPUSDT",
};

export function isCrypto(sym: string) {
  return sym.toUpperCase() in CRYPTO_MAP || sym.includes(":");
}

export function resolveSymbol(sym: string) {
  const u = sym.toUpperCase();
  return CRYPTO_MAP[u] ?? u;
}

function key() {
  const k = process.env.FINNHUB_API_KEY;
  if (!k) throw new Error("FINNHUB_API_KEY not configured");
  return k;
}

export type Quote = { symbol: string; price: number; change: number };

export async function getQuote(symbol: string): Promise<Quote | null> {
  const u = symbol.toUpperCase();
  if (isCrypto(u)) {
    // Use last candle close as price; compute % vs prior close.
    const series = await getCandles(u, "1W");
    if (!series || series.values.length < 2) return null;
    const prev = series.values[series.values.length - 2];
    const last = series.values[series.values.length - 1];
    return { symbol: u, price: last, change: Number((((last - prev) / prev) * 100).toFixed(2)) };
  }
  const res = await fetch(`${BASE}/quote?symbol=${encodeURIComponent(u)}&token=${key()}`);
  if (!res.ok) return null;
  const j = await res.json();
  if (!j || typeof j.c !== "number" || j.c === 0) return null;
  return { symbol: u, price: Number(j.c), change: Number((j.dp ?? 0).toFixed(2)) };
}

export type Range = "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y";

function rangeParams(range: Range): { resolution: string; from: number; to: number } {
  const now = Math.floor(Date.now() / 1000);
  const day = 86400;
  switch (range) {
    case "1D": return { resolution: "5", from: now - day, to: now };
    case "1W": return { resolution: "30", from: now - 7 * day, to: now };
    case "1M": return { resolution: "60", from: now - 30 * day, to: now };
    case "3M": return { resolution: "D", from: now - 90 * day, to: now };
    case "1Y": return { resolution: "D", from: now - 365 * day, to: now };
    case "5Y": return { resolution: "W", from: now - 5 * 365 * day, to: now };
  }
}

export type Candles = { symbol: string; range: Range; times: number[]; values: number[] };

export async function getCandles(symbol: string, range: Range = "1M"): Promise<Candles | null> {
  const u = symbol.toUpperCase();
  const resolved = resolveSymbol(u);
  const { resolution, from, to } = rangeParams(range);
  const path = isCrypto(u) ? "crypto/candle" : "stock/candle";
  const url = `${BASE}/${path}?symbol=${encodeURIComponent(resolved)}&resolution=${resolution}&from=${from}&to=${to}&token=${key()}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const j = await res.json();
  if (!j || j.s !== "ok" || !Array.isArray(j.c) || j.c.length === 0) return null;
  return { symbol: u, range, times: j.t as number[], values: (j.c as number[]).map((n) => Number(n)) };
}
