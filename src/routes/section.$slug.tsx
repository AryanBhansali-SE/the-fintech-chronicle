import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { SECTIONS, articlesByCategory } from "@/lib/mock";

export const Route = createFileRoute("/section/$slug")({
  loader: ({ params }) => {
    const section = SECTIONS.find((s) => s.slug === params.slug);
    if (!section) throw notFound();
    return { section, articles: articlesByCategory(params.slug) };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.section.name} — The Signal` },
          {
            name: "description",
            content: `${loaderData.section.name} coverage from The Signal.`,
          },
        ]
      : [],
  }),
  component: SectionPage,
  notFoundComponent: () => (
    <Layout>
      <div className="px-6 py-20 text-center">
        <h1 className="font-serif text-5xl font-black">Section not found</h1>
        <Link to="/" className="mt-6 inline-block underline smallcaps">Home</Link>
      </div>
    </Layout>
  ),
  errorComponent: ({ error }) => (
    <Layout><div className="px-6 py-20 text-center text-alert">{error.message}</div></Layout>
  ),
});

function SectionPage() {
  const { section, articles } = Route.useLoaderData();
  return (
    <Layout>
      <div className="mx-auto max-w-[1400px] px-6 py-10">
        <header className="rule-bottom pb-6">
          <p className="smallcaps text-xs text-muted-foreground">Section</p>
          <h1 className="font-serif text-6xl font-black">{section.name}</h1>
        </header>
        {articles.length === 0 ? (
          <p className="mt-12 text-muted-foreground">No articles in this section yet.</p>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
            className="mt-10 grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3"
          >
            {articles.map((a: typeof articles[number]) => (
              <motion.article
                key={a.slug}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                }}
                className="border-t-2 border-foreground pt-4"
              >
                <p className="smallcaps text-xs text-alert font-bold">{a.category}</p>
                <h4 className="mt-2 font-serif text-2xl font-bold leading-tight">
                  <Link to="/article/$slug" params={{ slug: a.slug }} className="hover:underline">
                    {a.title}
                  </Link>
                </h4>
                <p className="mt-2 text-sm text-muted-foreground">{a.dek}</p>
                <p className="mt-3 text-xs smallcaps text-muted-foreground">
                  {a.author} · {a.date} · {a.readTime} min
                </p>
              </motion.article>
            ))}
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
