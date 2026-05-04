import { Link } from "@tanstack/react-router";
import { SECTIONS } from "@/lib/mock";

export function Masthead() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="rule-bottom bg-background">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="flex items-center justify-between py-2 text-xs smallcaps text-muted-foreground">
          <span>{today}</span>
          <span>Vol. I · No. 42</span>
          <Link to="/auth" className="hover:text-foreground">
            Sign in
          </Link>
        </div>
        <div className="border-t border-foreground/20" />
        <Link to="/" className="block py-6 text-center">
          <h1 className="font-serif text-5xl md:text-7xl font-black tracking-tight leading-none">
            The Signal
          </h1>
          <p className="mt-2 text-xs smallcaps text-muted-foreground">
            Artificial Intelligence · Capital · Consequence
          </p>
        </Link>
        <nav className="rule-top flex flex-wrap items-center justify-center gap-x-8 gap-y-2 py-3 text-sm smallcaps">
          <Link to="/" className="hover:underline underline-offset-4">
            Front Page
          </Link>
          {SECTIONS.map((s) => (
            <Link
              key={s.slug}
              to="/section/$slug"
              params={{ slug: s.slug }}
              className="hover:underline underline-offset-4"
            >
              {s.name}
            </Link>
          ))}
          <Link to="/terminal" className="hover:underline underline-offset-4">
            Terminal
          </Link>
        </nav>
      </div>
    </header>
  );
}
