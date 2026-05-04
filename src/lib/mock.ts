export type Article = {
  slug: string;
  title: string;
  dek: string;
  category: string;
  author: string;
  date: string;
  readTime: number;
  hero?: string;
  body: string[];
  tags: string[];
};

export const ARTICLES: Article[] = [
  {
    slug: "llm-router-fintech-efficiency",
    title: "The Quiet Revolution: How LLM-as-a-Router Is Rewriting FinTech Efficiency",
    dek: "An unglamorous architectural choice is doing what a decade of microservices promised — and the balance sheets are starting to notice.",
    category: "Analysis",
    author: "M. Hartwell",
    date: "May 4, 2026",
    readTime: 9,
    body: [
      "For years, the financial industry has chased latency the way Formula 1 teams chase aerodynamic gains: in increments measured by milliseconds and millions of dollars. The newest gain, however, did not arrive as a faster GPU or a colder data center. It arrived as a routing pattern.",
      "The LLM-as-a-router model treats a small, fast language model as a dispatcher — reading an incoming request, classifying it, and forwarding it to the cheapest model capable of answering it. The result is not a smarter system but a more economical one.",
      "Three large investment banks now report token-cost reductions between 38% and 61% on internal copilots. None will go on the record. All will say, off it, that the savings are no longer optional.",
      "The deeper consequence is organizational. When a router decides which model handles a question, the role of the prompt engineer shifts upstream — from coaxing answers to shaping policies. Compliance teams, traditionally allergic to probabilistic systems, find themselves unusually comfortable: a routing policy is, after all, a rule.",
      "Whether this is a durable architecture or a transitional one is the question worth asking. Specialized small models keep getting better. Frontier models keep getting cheaper. The router sits between them — a thermostat for an industry that has, until now, only known how to turn the heat up.",
    ],
    tags: ["LLM", "FinTech", "Infrastructure"],
  },
  {
    slug: "sentiment-analysis-ai-papers-volatility",
    title: "Reading the Room: Predicting Market Volatility from the Tone of AI Research",
    dek: "Arxiv abstracts are leaking signal. A new generation of quants has noticed.",
    category: "Markets",
    author: "S. Okafor",
    date: "May 3, 2026",
    readTime: 7,
    body: [
      "There is a moment, hours before a major model release, when the language of AI researchers shifts. Hedged claims sharpen. Caveats thin. The abstracts grow shorter, the verbs more confident.",
      "A small but serious cluster of quantitative funds has begun to treat that shift as a tradable signal. The thesis is simple: sentiment in upstream research leads sentiment in downstream equities by between 36 and 72 hours.",
      "Backtests vary. The trade is not a free lunch. But the correlation is no longer noise.",
      "The interesting question is not whether the signal works today — it does, modestly — but how long it survives. As soon as enough capital chases a public dataset, the dataset stops paying. Arxiv is very public.",
    ],
    tags: ["Markets", "Sentiment", "AI Research"],
  },
  {
    slug: "global-mba-shift-tech-hubs",
    title: "The Global MBA Shift: Why Tech Hubs Are the New Wall Street",
    dek: "The pipeline that once ended in lower Manhattan now diverts through Bangalore, Lisbon, and Austin. What changed.",
    category: "Careers",
    author: "Editorial",
    date: "May 2, 2026",
    readTime: 6,
    body: [
      "For half a century, the elite MBA was, functionally, a finance degree with electives. The career outcome was not a job. It was a postcode.",
      "That postcode is moving. The 2025 placement reports — quietly published, loudly read — show a sustained migration of top decile graduates into engineering-adjacent operating roles at AI companies and the funds that finance them.",
      "Three forces are at work: compensation parity, optionality, and a generational suspicion of intermediation. The graduates are not abandoning finance. They are absorbing it.",
    ],
    tags: ["Careers", "MBA", "Talent"],
  },
  {
    slug: "nvidia-supply-chain-shift",
    title: "Inside Nvidia's Quiet Supply Chain Pivot",
    dek: "A reorganization too large to ignore, too discreet to confirm.",
    category: "Markets",
    author: "L. Tanaka",
    date: "May 1, 2026",
    readTime: 5,
    body: [
      "Something is moving in Hsinchu. Vendor schedules, freight bookings, and a curiously timed visit by senior procurement staff suggest a meaningful realignment of Nvidia's upstream suppliers.",
      "The official posture is silence. The unofficial one is preparation.",
    ],
    tags: ["Nvidia", "Supply Chain"],
  },
  {
    slug: "open-source-models-enterprise",
    title: "The Enterprise Quietly Falls Back in Love with Open Weights",
    dek: "Two years after writing them off, Fortune 500 CIOs are returning. With conditions.",
    category: "AI",
    author: "R. Pereira",
    date: "April 30, 2026",
    readTime: 6,
    body: [
      "The pendulum, as ever, swings. The same CIOs who declared open-weight models a security liability in 2024 are now standing up internal fine-tuning teams and signing GPU leases measured in years.",
      "The reason is not ideological. It is contractual. Frontier API pricing has stopped falling at the rate procurement committees had penciled in.",
    ],
    tags: ["Open Source", "Enterprise"],
  },
  {
    slug: "regulators-catch-up-agents",
    title: "Regulators Are Finally Catching Up to Autonomous Agents",
    dek: "The question is no longer whether to regulate AI agents in finance, but how badly the first attempt will go.",
    category: "Analysis",
    author: "Editorial",
    date: "April 28, 2026",
    readTime: 8,
    body: [
      "Every era of financial automation has its first scandal. Program trading had 1987. High-frequency had the Flash Crash. Autonomous agents will have something — the only open question is the date.",
      "The draft rules circulating in Brussels and Washington are, at best, a thoughtful attempt to legislate a moving target. At worst, they are a blueprint for the next jurisdiction to win the business.",
    ],
    tags: ["Regulation", "Agents"],
  },
];

export const TICKERS = [
  { symbol: "NVDA", price: 1284.32, change: +2.14 },
  { symbol: "MSFT", price: 478.91, change: +0.62 },
  { symbol: "GOOGL", price: 198.44, change: -0.31 },
  { symbol: "META", price: 612.18, change: +1.04 },
  { symbol: "AMZN", price: 224.55, change: -0.88 },
  { symbol: "TSLA", price: 287.12, change: +3.41 },
  { symbol: "AAPL", price: 245.67, change: -0.12 },
  { symbol: "AMD", price: 198.22, change: +1.78 },
  { symbol: "BTC", price: 84210.5, change: -1.22 },
  { symbol: "ETH", price: 4218.4, change: -0.74 },
];

export const SECTIONS = [
  { slug: "ai", name: "AI" },
  { slug: "markets", name: "Markets" },
  { slug: "analysis", name: "Analysis" },
  { slug: "careers", name: "Careers" },
];

export const AI_EVENTS = [
  { date: "2026-04-28", title: "GPT-5.2 released", impact: "+4.2% NVDA over 5d" },
  { date: "2026-04-21", title: "Anthropic raises $8B", impact: "+1.9% MSFT over 3d" },
  { date: "2026-04-12", title: "Llama 4 weights leak", impact: "−2.1% META over 2d" },
  { date: "2026-03-30", title: "EU AI Act amendments", impact: "−0.8% sector" },
  { date: "2026-03-18", title: "Gemini 3 announced", impact: "+3.1% GOOGL over 4d" },
];

export function findArticle(slug: string) {
  return ARTICLES.find((a) => a.slug === slug);
}
export function articlesByCategory(slug: string) {
  const name = SECTIONS.find((s) => s.slug === slug)?.name;
  return ARTICLES.filter((a) => a.category.toLowerCase() === (name ?? "").toLowerCase());
}
