export function SiteFooter() {
  return (
    <footer className="mt-16 rule-top bg-background">
      <div className="mx-auto max-w-[1400px] px-6 py-10 grid gap-6 md:grid-cols-3 text-sm">
        <div>
          <h3 className="font-serif text-2xl font-black">The Signal</h3>
          <p className="mt-2 text-muted-foreground">
            Independent reporting at the intersection of artificial intelligence and capital markets.
          </p>
        </div>
        <div>
          <h4 className="smallcaps text-xs text-muted-foreground">Sections</h4>
          <ul className="mt-2 space-y-1">
            <li>AI</li><li>Markets</li><li>Analysis</li><li>Careers</li>
          </ul>
        </div>
        <div>
          <h4 className="smallcaps text-xs text-muted-foreground">About</h4>
          <p className="mt-2 text-muted-foreground">
            © {new Date().getFullYear()} The Signal. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
