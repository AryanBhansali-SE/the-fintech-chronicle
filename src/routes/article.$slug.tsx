import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { findArticle, ARTICLES } from "@/lib/mock";

export const Route = createFileRoute("/article/$slug")({
  loader: ({ params }) => {
    const article = findArticle(params.slug);
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.article.title} — The Signal` },
          { name: "description", content: loaderData.article.dek },
          { property: "og:title", content: loaderData.article.title },
          { property: "og:description", content: loaderData.article.dek },
        ]
      : [],
  }),
  component: ArticlePage,
  notFoundComponent: () => (
    <Layout>
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="font-serif text-5xl font-black">Article not found</h1>
        <Link to="/" className="mt-6 inline-block smallcaps underline">
          Back to front page
        </Link>
      </div>
    </Layout>
  ),
  errorComponent: ({ error }) => (
    <Layout>
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="text-alert">{error.message}</p>
      </div>
    </Layout>
  ),
});

function ArticlePage() {
  const { article } = Route.useLoaderData();
  const related = ARTICLES.filter(
    (a) => a.slug !== article.slug && a.category === article.category,
  ).slice(0, 3);

  return (
    <Layout>
      <article className="mx-auto max-w-[1100px] px-6 py-12">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center rule-bottom pb-8"
        >
          <p className="smallcaps text-xs text-alert font-bold">{article.category}</p>
          <h1 className="mt-3 font-serif text-4xl md:text-6xl font-black leading-tight tracking-tight">
            {article.title}
          </h1>
          <p className="mt-5 text-xl md:text-2xl font-serif italic text-muted-foreground max-w-3xl mx-auto">
            {article.dek}
          </p>
          <p className="mt-6 text-xs smallcaps text-muted-foreground">
            By {article.author} · {article.date} · {article.readTime} min read
          </p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-10 max-w-[720px] mx-auto md:columns-2 md:gap-8 [column-rule:1px_solid_var(--color-border)]"
        >
          {article.body.map((p: string, i: number) => (
            <p
              key={i}
              className={`mb-5 text-[17px] leading-8 break-inside-avoid ${i === 0 ? "dropcap" : ""}`}
            >
              {p}
            </p>
          ))}
        </motion.div>

        <div className="mt-10 max-w-[720px] mx-auto flex flex-wrap gap-2">
          {article.tags.map((t: string) => (
            <span
              key={t}
              className="text-xs smallcaps border border-foreground/30 px-2 py-1"
            >
              {t}
            </span>
          ))}
        </div>

        {related.length > 0 && (
          <section className="mt-16 rule-top pt-8">
            <h3 className="font-serif text-2xl font-black mb-6">Related from {article.category}</h3>
            <div className="grid gap-6 md:grid-cols-3">
              {related.map((a) => (
                <article key={a.slug} className="border-t-2 border-foreground pt-3">
                  <h4 className="font-serif text-xl font-bold leading-tight">
                    <Link to="/article/$slug" params={{ slug: a.slug }} className="hover:underline">
                      {a.title}
                    </Link>
                  </h4>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{a.dek}</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </article>
    </Layout>
  );
}
