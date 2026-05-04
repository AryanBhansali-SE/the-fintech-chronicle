import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { fetchPublishedPosts, formatDate, type Post } from "@/lib/posts";

export const Route = createFileRoute("/")({
  loader: async () => ({ posts: await fetchPublishedPosts() }),
  component: Index,
  head: () => ({
    meta: [
      { title: "The Signal — AI, Capital, Consequence" },
      {
        name: "description",
        content:
          "Independent reporting at the intersection of artificial intelligence and capital markets.",
      },
    ],
  }),
  errorComponent: ({ error }) => (
    <Layout><div className="p-12 text-center text-alert">{error.message}</div></Layout>
  ),
});

const stagger = { show: { transition: { staggerChildren: 0.08 } } };
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function Card({ a }: { a: Post }) {
  return (
    <article className="border-t-2 border-foreground pt-4">
      <p className="smallcaps text-xs text-alert font-bold">{a.category}</p>
      <h4 className="mt-2 font-serif text-2xl font-bold leading-tight">
        <Link to="/article/$slug" params={{ slug: a.slug }} className="hover:underline">
          {a.title}
        </Link>
      </h4>
      <p className="mt-2 text-sm text-muted-foreground">{a.dek}</p>
      <p className="mt-3 text-xs smallcaps text-muted-foreground">
        {formatDate(a.published_at)} · {a.read_minutes ?? 5} min
      </p>
    </article>
  );
}

function Index() {
  const { posts } = Route.useLoaderData();

  if (posts.length === 0) {
    return (
      <Layout>
        <div className="mx-auto max-w-2xl p-16 text-center">
          <h2 className="font-serif text-4xl font-black">No published stories yet</h2>
          <p className="mt-4 text-muted-foreground">
            Sign in as an admin and use the Editor-in-Chief to publish your first piece.
          </p>
        </div>
      </Layout>
    );
  }

  const lead = posts[0];
  const featured = posts.slice(1, 5);
  const grid = posts.slice(1);
  const leadParas = lead.body_md.split(/\n\n+/);

  return (
    <Layout>
      <div className="mx-auto max-w-[1400px] px-6 py-10">
        <motion.section initial="hidden" animate="show" variants={stagger} className="rule-bottom pb-10">
          <motion.p variants={item} className="smallcaps text-xs text-alert font-bold">
            ● Lead Story · {lead.category}
          </motion.p>
          <motion.h2 variants={item} className="mt-3 font-serif text-5xl md:text-7xl font-black leading-[1.02] tracking-tight">
            <Link to="/article/$slug" params={{ slug: lead.slug }} className="hover:underline">
              {lead.title}
            </Link>
          </motion.h2>
          <motion.p variants={item} className="mt-5 text-xl md:text-2xl font-serif italic text-muted-foreground max-w-4xl">
            {lead.dek}
          </motion.p>
          <motion.div variants={item} className="mt-6 grid md:grid-cols-3 gap-8">
            {leadParas[0] && <p className="dropcap text-[15px] leading-7">{leadParas[0]}</p>}
            {leadParas[1] && <p className="text-[15px] leading-7">{leadParas[1]}</p>}
            <div className="text-[15px] leading-7">
              {leadParas[2] && <p>{leadParas[2]}</p>}
              <Link
                to="/article/$slug"
                params={{ slug: lead.slug }}
                className="mt-4 inline-block smallcaps font-bold underline underline-offset-4"
              >
                Continue reading →
              </Link>
            </div>
          </motion.div>
          <motion.p variants={item} className="mt-6 text-xs smallcaps text-muted-foreground">
            {formatDate(lead.published_at)} · {lead.read_minutes ?? 5} min read
          </motion.p>
        </motion.section>

        {featured.length > 0 && (
          <section className="py-10 rule-bottom">
            <div className="flex items-baseline justify-between mb-6">
              <h3 className="font-serif text-3xl font-black">Featured</h3>
              <span className="smallcaps text-xs text-muted-foreground">scroll →</span>
            </div>
            <div className="no-scrollbar -mx-6 overflow-x-auto px-6">
              <div className="flex gap-6 pb-2 snap-x snap-mandatory">
                {featured.map((a: Post, i: number) => (
                  <motion.article
                    key={a.id}
                    initial={{ opacity: 0, x: 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                    className="snap-start shrink-0 w-[320px] md:w-[400px] border-l border-foreground/20 pl-5"
                  >
                    <p className="smallcaps text-xs text-alert font-bold">{a.category}</p>
                    <h4 className="mt-2 font-serif text-2xl font-bold leading-tight">
                      <Link to="/article/$slug" params={{ slug: a.slug }} className="hover:underline">
                        {a.title}
                      </Link>
                    </h4>
                    <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{a.dek}</p>
                    <p className="mt-3 text-xs smallcaps text-muted-foreground">
                      {formatDate(a.published_at)} · {a.read_minutes ?? 5} min
                    </p>
                  </motion.article>
                ))}
              </div>
            </div>
          </section>
        )}

        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="py-10"
        >
          <h3 className="font-serif text-3xl font-black mb-6">More from the desk</h3>
          <div className="grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {grid.map((a: Post) => (
              <motion.div key={a.id} variants={item}><Card a={a} /></motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </Layout>
  );
}
