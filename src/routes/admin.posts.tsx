import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/posts")({
  component: AdminPosts,
  head: () => ({ meta: [{ title: "Posts — Editor-in-Chief" }] }),
});

type Row = {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string;
  published_at: string | null;
  updated_at: string;
};

function AdminPosts() {
  const { user, loading, isAdmin } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  useEffect(() => {
    if (!isAdmin) return;
    supabase
      .from("posts")
      .select("id,title,slug,status,category,published_at,updated_at")
      .order("updated_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        else setRows((data ?? []) as Row[]);
        setBusy(false);
      });
  }, [isAdmin]);

  async function remove(id: string) {
    if (!confirm("Delete this post permanently?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((r) => r.filter((x) => x.id !== id));
    toast.success("Deleted.");
  }

  if (loading) return <Layout><div className="p-16 text-center smallcaps">Loading…</div></Layout>;
  if (!isAdmin) {
    return (
      <Layout>
        <div className="mx-auto max-w-2xl p-16 text-center">
          <h1 className="font-serif text-4xl font-black">Restricted</h1>
          <p className="mt-3 text-muted-foreground">Editor-in-Chief access only.</p>
          <Link to="/" className="mt-6 inline-block smallcaps underline">Back to front page</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-[1100px] px-6 py-12">
        <header className="rule-bottom pb-6 flex items-end justify-between">
          <div>
            <p className="smallcaps text-xs text-alert font-bold">● Editor-in-Chief</p>
            <h1 className="font-serif text-5xl font-black mt-2">Posts</h1>
          </div>
          <Link
            to="/admin/posts/new"
            className="bg-ink text-paper px-4 py-2 smallcaps font-bold hover:bg-foreground/80 transition-colors"
          >
            + New post
          </Link>
        </header>

        {busy ? (
          <p className="mt-12 text-center smallcaps text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="mt-12 text-center text-muted-foreground">
            No posts yet. Start with <Link to="/admin/posts/new" className="underline">a new draft</Link>.
          </p>
        ) : (
          <table className="mt-8 w-full border-collapse">
            <thead className="text-xs smallcaps text-muted-foreground border-b border-foreground/30">
              <tr>
                <th className="text-left py-2">Title</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Category</th>
                <th className="text-left py-2">Updated</th>
                <th className="py-2 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border">
                  <td className="py-3 font-serif text-lg">
                    <Link to="/admin/posts/$id" params={{ id: r.id }} className="hover:underline">
                      {r.title}
                    </Link>
                  </td>
                  <td className="py-3">
                    <span className={`text-xs smallcaps font-bold ${r.status === "published" ? "text-alert" : "text-muted-foreground"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 text-sm">{r.category}</td>
                  <td className="py-3 text-xs text-muted-foreground">
                    {new Date(r.updated_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-right">
                    <button onClick={() => remove(r.id)} className="text-xs smallcaps text-alert hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <p className="mt-10 text-center text-xs">
          <Link to="/admin" className="smallcaps underline">← Newsroom</Link>
        </p>
      </div>
    </Layout>
  );
}
