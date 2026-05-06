import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Draft = {
  id?: string;
  title: string;
  dek: string;
  category: string;
  tags: string;
  hero_url: string;
  body_md: string;
  status: "draft" | "published";
  slug: string;
  read_minutes: number;
};

const EMPTY: Draft = {
  title: "",
  dek: "",
  category: "Analysis",
  tags: "",
  hero_url: "",
  body_md: "",
  status: "draft",
  slug: "",
  read_minutes: 5,
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function readMinutes(body: string) {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function PostEditor({ postId }: { postId?: string }) {
  const { user, loading, isAdmin } = useAuth();
  const nav = useNavigate();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(!!postId);
  const [saving, setSaving] = useState(false);
  const slugTouched = useRef(false);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  useEffect(() => {
    if (!postId || !isAdmin) return;
    supabase
      .from("posts")
      .select("*")
      .eq("id", postId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        else if (data) {
          slugTouched.current = true;
          setDraft({
            id: data.id,
            title: data.title,
            dek: data.dek ?? "",
            category: data.category,
            tags: (data.tags ?? []).join(", "),
            hero_url: data.hero_url ?? "",
            body_md: data.body_md,
            status: data.status as "draft" | "published",
            slug: data.slug,
            read_minutes: data.read_minutes ?? 5,
          });
        }
        setBusy(false);
      });
  }, [postId, isAdmin]);

  function update<K extends keyof Draft>(k: K, v: Draft[K]) {
    setDraft((d) => {
      const next = { ...d, [k]: v };
      if (k === "title" && !slugTouched.current) next.slug = slugify(v as string);
      if (k === "body_md") next.read_minutes = readMinutes(v as string);
      return next;
    });
  }

  async function save(publish?: boolean) {
    if (!draft.title.trim()) return toast.error("Title is required.");
    if (!draft.slug.trim()) return toast.error("Slug is required.");
    setSaving(true);
    const status = publish === undefined ? draft.status : publish ? "published" : "draft";
    const payload = {
      title: draft.title.trim(),
      slug: draft.slug.trim(),
      dek: draft.dek.trim() || null,
      category: draft.category.trim() || "Analysis",
      tags: draft.tags.split(",").map((t) => t.trim()).filter(Boolean),
      hero_url: draft.hero_url.trim() || null,
      body_md: draft.body_md,
      status,
      read_minutes: draft.read_minutes,
      author_id: user?.id ?? null,
      published_at:
        status === "published" ? new Date().toISOString() : null,
    };

    const q = draft.id
      ? supabase.from("posts").update(payload).eq("id", draft.id).select().single()
      : supabase.from("posts").insert(payload).select().single();
    const { data, error } = await q;
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(status === "published" ? "Published." : "Saved.");
    if (!draft.id && data) nav({ to: "/admin/posts/$id", params: { id: data.id } });
    else setDraft((d) => ({ ...d, status: status as "draft" | "published" }));
  }

  if (loading || busy) return <Layout><div className="p-16 text-center smallcaps">Loading…</div></Layout>;
  if (!isAdmin) {
    return (
      <Layout>
        <div className="mx-auto max-w-2xl p-16 text-center">
          <h1 className="font-serif text-4xl font-black">Restricted</h1>
          <Link to="/" className="mt-6 inline-block smallcaps underline">Back to front page</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <div className="flex items-center justify-between rule-bottom pb-4">
          <Link to="/admin/posts" className="smallcaps text-xs text-muted-foreground hover:text-foreground">
            ← All posts
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs smallcaps text-muted-foreground">
              {draft.status} · {draft.read_minutes} min
            </span>
            <button
              onClick={() => save(false)}
              disabled={saving}
              className="border border-foreground px-4 py-2 text-xs smallcaps font-bold disabled:opacity-50 hover:bg-foreground hover:text-background transition-colors"
            >
              Save draft
            </button>
            <button
              onClick={() => save(true)}
              disabled={saving}
              className="bg-ink text-paper px-4 py-2 text-xs smallcaps font-bold disabled:opacity-50 hover:bg-foreground/80 transition-colors"
            >
              {saving ? "…" : "Publish"}
            </button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 mt-6">
          {/* EDITOR */}
          <div className="space-y-4">
            <input
              value={draft.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Title"
              className="w-full bg-transparent border-b-2 border-foreground py-2 font-serif text-4xl font-black outline-none focus:border-alert"
            />
            <input
              value={draft.dek}
              onChange={(e) => update("dek", e.target.value)}
              placeholder="Dek (subtitle / standfirst)"
              className="w-full bg-transparent border-b border-border py-2 font-serif italic text-lg outline-none focus:border-alert"
            />
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="smallcaps text-xs text-muted-foreground">Category</span>
                <input
                  value={draft.category}
                  onChange={(e) => update("category", e.target.value)}
                  className="mt-1 w-full bg-transparent border-b border-border py-1 outline-none focus:border-alert"
                />
              </label>
              <label className="block">
                <span className="smallcaps text-xs text-muted-foreground">Slug</span>
                <input
                  value={draft.slug}
                  onChange={(e) => {
                    slugTouched.current = true;
                    update("slug", slugify(e.target.value));
                  }}
                  className="mt-1 w-full bg-transparent border-b border-border py-1 font-mono text-sm outline-none focus:border-alert"
                />
              </label>
            </div>
            <label className="block">
              <span className="smallcaps text-xs text-muted-foreground">Tags (comma separated)</span>
              <input
                value={draft.tags}
                onChange={(e) => update("tags", e.target.value)}
                className="mt-1 w-full bg-transparent border-b border-border py-1 outline-none focus:border-alert"
              />
            </label>
            <label className="block">
              <span className="smallcaps text-xs text-muted-foreground">Hero image URL</span>
              <input
                value={draft.hero_url}
                onChange={(e) => update("hero_url", e.target.value)}
                placeholder="https://…"
                className="mt-1 w-full bg-transparent border-b border-border py-1 font-mono text-sm outline-none focus:border-alert"
              />
            </label>

            <div>
              <div className="flex items-center justify-between">
                <span className="smallcaps text-xs text-muted-foreground">Body (Markdown)</span>
                <MarkdownToolbarHint />
              </div>
              <textarea
                value={draft.body_md}
                onChange={(e) => update("body_md", e.target.value)}
                placeholder={`# Heading\n\nWrite your story here. Use **bold**, *italic*, [links](https://…), > quotes, and lists.\n\n## Subhead\n\n- point one\n- point two`}
                className="mt-2 w-full min-h-[60vh] bg-transparent border border-border rounded-sm p-4 font-mono text-sm leading-6 outline-none focus:border-alert resize-y"
              />
            </div>
          </div>

          {/* PREVIEW */}
          <div className="lg:sticky lg:top-6 self-start">
            <p className="smallcaps text-xs text-muted-foreground mb-3">Live preview</p>
            <article className="border border-border rounded-sm p-6 max-h-[80vh] overflow-y-auto bg-card">
              <p className="smallcaps text-xs text-alert font-bold">{draft.category || "Analysis"}</p>
              <h1 className="mt-2 font-serif text-4xl font-black leading-tight">
                {draft.title || "Untitled"}
              </h1>
              {draft.dek && (
                <p className="mt-3 font-serif italic text-lg text-muted-foreground">{draft.dek}</p>
              )}
              {draft.hero_url && (
                <img src={draft.hero_url} alt="" className="mt-5 w-full object-cover rounded-sm" />
              )}
              <div className="prose prose-neutral dark:prose-invert mt-6 max-w-none font-serif text-[17px] leading-8">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {draft.body_md || "_Start writing to see a preview._"}
                </ReactMarkdown>
              </div>
            </article>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function MarkdownToolbarHint() {
  return (
    <span className="text-[10px] smallcaps text-muted-foreground">
      # H1 · ## H2 · **bold** · *italic* · [link](url) · &gt; quote · - list
    </span>
  );
}
