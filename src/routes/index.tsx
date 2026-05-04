import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { ARTICLES } from "@/lib/mock";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "The Signal — AI, Capital, Consequence" },
      {
        name: "description",
        content:
          "Independent reporting at the intersection of artificial intelligence and capital markets. Live tickers, deep analysis, and an AI editor.",
      },
    ],
  }),
});

const stagger = {
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

function Index() {
  const lead = ARTICLES[0];
  const featured = ARTICLES.slice(1, 5);
  const grid = ARTICLES.slice(1);

  return (
    <Layout>
      <div className="mx-auto max-w-[1400px] px-6 py-10">
        {/* Lead story — multi-column hero */}
        <motion.section
          initial="hidden"
          animate="show"
          variants={stagger}
          className="rule-bottom pb-10"
        >
          <motion.p variants={item} className="smallcaps text-xs text-alert font-bold">
            ● Lead Story · {lead.category}
          </motion.p>
          <motion.h2
            variants={item}
            className="mt-3 font-serif text-5xl md:text-7xl font-black leading-[1.02] tracking-tight"
          >
            <Link to="/article/$slug" params={{ slug: lead.slug }} className="hover:underline">
              {lead.title}
            </Link>
          </motion.h2>
          <motion.p variants={item} className="mt-5 text-xl md:text-2xl font-serif italic text-muted-foreground max-w-4xl">
            {lead.dek}
          </motion.p>
          <motion.div variants={item} className="mt-6 grid md:grid-cols-3 gap-8">
            <p className="dropcap text-[15px] leading-7">{lead.body[0]}</p>
            <p className="text-[15px] leading-7">{lead.body[1]}</p>
            <div className="text-[15px] leading-7">
              <p>{lead.body[2]}</p>
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
            By {lead.author} · {lead.date} · {lead.readTime} min read
          </motion.p>
        </motion.section>

        {/* Horizontal-scroll featured rail */}
        <section className="py-10 rule-bottom">
          <div className="flex items-baseline justify-between mb-6">
            <h3 className="font-serif text-3xl font-black">Featured</h3>
            <span className="smallcaps text-xs text-muted-foreground">scroll →</span>
          </div>
          <div className="no-scrollbar -mx-6 overflow-x-auto px-6">
            <div className="flex gap-6 pb-2 snap-x snap-mandatory">
              {featured.map((a, i) => (
                <motion.article
                  key={a.slug}
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
                    {a.author} · {a.readTime} min
                  </p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Multi-column grid */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="py-10"
        >
          <h3 className="font-serif text-3xl font-black mb-6">More from the desk</h3>
          <div className="grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {grid.map((a) => (
              <motion.article
                key={a.slug}
                variants={item}
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
          </div>
        </motion.section>
      </div>
    </Layout>
  );
}
