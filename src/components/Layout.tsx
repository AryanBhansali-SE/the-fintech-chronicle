import { type ReactNode } from "react";
import { Masthead } from "./Masthead";
import { Ticker } from "./Ticker";
import { SiteFooter } from "./SiteFooter";
import { Concierge } from "./Concierge";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Masthead />
      <Ticker />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <Concierge />
    </div>
  );
}
