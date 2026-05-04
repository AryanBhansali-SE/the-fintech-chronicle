import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin")({
  component: Admin,
  head: () => ({ meta: [{ title: "Editor-in-Chief — The Signal" }] }),
});

function Admin() {
  const { user, role, loading, isAdmin } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  if (loading) return <Layout><div className="p-16 text-center smallcaps">Loading…</div></Layout>;

  if (!isAdmin) {
    return (
      <Layout>
        <div className="mx-auto max-w-2xl p-16 text-center">
          <p className="smallcaps text-xs text-alert font-bold">● Restricted</p>
          <h1 className="font-serif text-5xl font-black mt-3">Editor-in-Chief</h1>
          <p className="mt-6 text-muted-foreground">
            This area is reserved for the editor. Your account ({user?.email}) currently has the role
            <span className="font-mono"> {role}</span>. To grant yourself admin access, run this once
            in the database:
          </p>
          <pre className="mt-4 text-left text-xs bg-card border border-border p-4 overflow-x-auto">
{`INSERT INTO public.user_roles (user_id, role)
VALUES ('${user?.id ?? "<your-user-id>"}', 'admin')
ON CONFLICT DO NOTHING;`}
          </pre>
          <Link to="/" className="mt-8 inline-block smallcaps underline">Back to front page</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <header className="rule-bottom pb-6">
          <p className="smallcaps text-xs text-alert font-bold">● Editor-in-Chief</p>
          <h1 className="font-serif text-5xl font-black mt-2">Newsroom</h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Welcome back, {user?.email}. Your AI assistant, style profile, vault, and analytics
            dashboards land here next.
          </p>
        </header>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "AI Assistant", body: "Chat with the LLM-as-router. Drafts in your voice." },
            { title: "Research Vault", body: "Private notes, papers, and embeddings." },
            { title: "Style Profile", body: "Upload samples; the AI learns your tone." },
            { title: "Audience Analytics", body: "Reading patterns, sentiment trends." },
            { title: "Topic Suggestions", body: "AI-suggested upcoming stories." },
            { title: "Sources", body: "RSS + API source configuration." },
          ].map((c) => (
            <div key={c.title} className="border-t-2 border-foreground pt-4">
              <h3 className="font-serif text-2xl font-bold">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
              <p className="mt-3 text-xs smallcaps text-muted-foreground">Coming next</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
