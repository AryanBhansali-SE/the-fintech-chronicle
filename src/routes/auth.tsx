import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({ meta: [{ title: "Sign in — The Signal" }] }),
});

function AuthPage() {
  return (
    <Layout>
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="font-serif text-5xl font-black">Sign in</h1>
        <p className="mt-4 text-muted-foreground">
          Reader accounts and the Editor-in-Chief assistant arrive once we wire up the backend.
          Confirm and we'll enable Lovable Cloud and ship auth, the database, and the AI agent next.
        </p>
        <Link
          to="/"
          className="mt-8 inline-block smallcaps underline underline-offset-4"
        >
          Back to front page
        </Link>
      </div>
    </Layout>
  );
}
