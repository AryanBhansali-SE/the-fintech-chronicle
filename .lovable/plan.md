
# AI-Finance Newspaper — Build Plan

A luxury, interactive newspaper-style platform covering AI × finance, with live market data, an AI "Editor-in-Chief" that drafts in your voice, and reader analytics.

> Stack note: This project runs on **TanStack Start + Tailwind CSS v4** (not Next.js). Animations via **Framer Motion**. Backend via **Lovable Cloud** (Supabase). AI via **Lovable AI Gateway**.

---

## 1. Visual Identity

- **Palette**: Paper White `#F4F4F4`, Ink Black `#1A1A1A`, Alert Red `#D32F2F` (live data only).
- **Typography**: Serif display (Playfair / Fraunces) for headlines + drop caps; clean sans (Inter) for body; mono (JetBrains Mono) for tickers.
- **Newspaper feel**: Multi-column article layouts, hairline rules, masthead, drop caps on first paragraph, small-caps bylines, dateline.
- **Motion**: Horizontal scroll for "Featured Stories" rail; staggered entrance for article grids; live ticker marquee; subtle pulse on price updates (red flash on negative, no flash on positive — keep red reserved).

---

## 2. Information Architecture

```text
/                       Front page (masthead, ticker, featured horizontal rail, sections grid)
/section/$slug          Section page (AI, Markets, Analysis, MBA/Careers)
/article/$slug          Article reader (multi-column, drop cap, related)
/terminal               Interactive Trading Terminal (AI events × market moves)
/auth                   Sign in / sign up (readers)
/account                Reader profile, saved articles, topic prefs
/admin                  Editor-in-Chief dashboard (admin-only)
  /admin/assistant      AI agent chat + drafts
  /admin/vault          AI Research Vault (your private notes, papers)
  /admin/style          Style profile + sample uploads
  /admin/analytics      Audience analytics + sentiment trends
  /admin/sources        RSS feeds + API source config
```

---

## 3. Core Features

### A. Verified Data Engine
Aggregates and normalizes content from:
- **RSS**: Reuters, FT, Bloomberg, ArXiv (cs.AI / cs.LG)
- **Finnhub**: company news + quotes
- **Alpha Vantage**: stock time-series
- **CoinGecko**: crypto prices (no key)

Implementation:
- Server functions fetch + cache feeds (15-min TTL for news, 60s for quotes).
- `news_items` table stores deduped articles with source, url, published_at, category, sentiment_score.
- A scheduled refresh endpoint (`/api/public/refresh-feeds`) callable by cron; also refreshes on-demand from admin.
- Live ticker pulls latest quotes for a configurable watchlist.

### B. Editor-in-Chief AI Assistant (Full Agent)
Private, admin-only chat panel with **LLM-as-router** over tools:
- `web_search` (via web search API)
- `fetch_rss` (your configured feeds)
- `get_quote` / `get_news` (Finnhub, Alpha Vantage)
- `query_vault` (semantic search over your Research Vault)
- `save_draft` (writes to `posts` as status=draft)
- `publish_post` (status=published, with confirm)

Voice matching:
- Upload 3–10 sample posts (PDF/MD/TXT) → parsed → AI extracts a **style profile** (tone, sentence length, vocabulary, structural habits) stored in `style_profiles`.
- Every draft generation injects style profile + 2–3 sample excerpts as few-shot.

Streaming responses, tool-call traces visible in UI, "Accept as draft" / "Refine" actions.

### C. Audience Analytics Engine
- Track per-article: views, read-time, scroll depth, completion %.
- Reader topic affinity from tag interactions.
- **Sentiment Trends**: aggregate sentiment of articles users dwell on → suggested next topics surfaced in admin analytics.
- Admin dashboard: top articles, trending tags, sentiment heatmap (last 30 days), suggested topics list with one-click "Draft this" → opens assistant pre-prompted.

### D. Interactive Trading Terminal
Minimalist widget on `/terminal`:
- Left: timeline of major AI events (model releases, papers, company news from feeds).
- Right: chart of selected ticker (NVDA, MSFT, GOOGL, etc.) with event markers overlaid.
- Hover an event → highlights price move in following N days; shows simple correlation stat.
- Watchlist editable; all data via the Verified Data Engine.

### E. Reader Auth & Personalization
- Email/password + Google sign-in (Lovable Cloud).
- Signed-in readers can: save articles, follow tags, comment, see personalized "For You" rail.
- Public visitors get full read access (no paywall).

---

## 4. Initial Content
Seed three drafted-by-AI posts (you approve before publish) on:
1. Impact of LLM-as-a-Router on FinTech Efficiency
2. Predicting Market Volatility via Sentiment Analysis of AI Research Papers
3. The Global MBA Shift: Tech Hubs as the New Wall Street

---

## 5. Data Model (Supabase)

- `profiles` (id → auth.users, display_name, avatar_url)
- `user_roles` (user_id, role: admin|reader) — separate table per security best practice
- `posts` (id, slug, title, dek, body_md, hero_url, status, author_id, published_at, tags[])
- `news_items` (id, source, url, title, summary, category, sentiment, published_at)
- `watchlist` (user_id, symbols[])
- `quotes_cache` (symbol, price, change, updated_at)
- `events_timeline` (id, kind, title, url, occurred_at) — for terminal
- `reading_events` (user_id|null, post_id, event_type, value, created_at)
- `saved_articles` (user_id, post_id)
- `style_profiles` (user_id, profile_json, samples_text)
- `vault_entries` (user_id, title, content, embedding, source_url)
- `assistant_threads` / `assistant_messages` (admin chat history + tool traces)
- `topic_suggestions` (title, rationale, score, created_at)

RLS: posts public-read when published; admin-write. User-scoped tables locked to `auth.uid()`. Admin tables gated via `has_role(uid,'admin')`.

---

## 6. Technical Notes

- **AI**: Lovable AI Gateway, default `google/gemini-3-flash-preview`; escalate to `openai/gpt-5` for long-form drafting and tool-routing.
- **Embeddings** (vault search): pgvector + Gemini embeddings.
- **Secrets needed** (you'll be prompted at the right step): `FINNHUB_API_KEY`, `ALPHA_VANTAGE_API_KEY`. CoinGecko + RSS need none. `LOVABLE_API_KEY` is auto-provisioned.
- **Server functions** for all third-party calls (no client-side API keys).
- **Cron**: `/api/public/refresh-feeds` + `/api/public/refresh-quotes` triggered by pg_cron.

---

## 7. Build Order

1. Design system (tokens, fonts, masthead, ticker shell) + home page skeleton with mock data.
2. Auth (reader sign-in/up, admin role bootstrap for you).
3. Database schema + RLS + seed posts.
4. Verified Data Engine: RSS + CoinGecko first (no keys), then Finnhub + Alpha Vantage after you add keys.
5. Article reader + section pages with multi-column + drop caps + staggered animations.
6. Admin shell + AI Editor-in-Chief (chat → drafter → tools → publish).
7. Style profile uploader + extraction.
8. Trading Terminal.
9. Reading analytics tracking + admin analytics dashboard + topic suggestions.
10. Polish: horizontal-scroll featured rail, ticker animation, motion pass.
