import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({ meta: [{ title: "Sign in — The Signal" }] }),
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created. You're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
      }
      nav({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-md px-6 py-16">
        <header className="text-center rule-bottom pb-6">
          <p className="smallcaps text-xs text-muted-foreground">Subscriber access</p>
          <h1 className="font-serif text-5xl font-black mt-2">
            {mode === "signin" ? "Sign in" : "Create account"}
          </h1>
        </header>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <label className="block">
            <span className="smallcaps text-xs text-muted-foreground">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border-b-2 border-foreground bg-transparent py-2 font-serif text-lg outline-none focus:border-alert"
            />
          </label>
          <label className="block">
            <span className="smallcaps text-xs text-muted-foreground">Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border-b-2 border-foreground bg-transparent py-2 font-serif text-lg outline-none focus:border-alert"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-ink text-paper py-3 smallcaps font-bold disabled:opacity-50 hover:bg-foreground/80 transition-colors"
          >
            {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm">
          {mode === "signin" ? "New here? " : "Already have an account? "}
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="underline underline-offset-4 smallcaps"
          >
            {mode === "signin" ? "Create account" : "Sign in"}
          </button>
        </p>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          <Link to="/" className="underline">Back to front page</Link>
        </p>
      </div>
    </Layout>
  );
}
