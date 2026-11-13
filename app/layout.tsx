import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { NavLinks } from "@/components/NavLinks";

const plex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "600", "700"] });

export const metadata: Metadata = {
  title: "SA Flag Board",
  description:
    "Counsellor flag board for the Situational Analysis wellbeing survey (synthetic data only).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={plex.className}>
        <header className="site-header">
          <div className="wordmark">
            SA Flag Board
            <small>Situational Analysis · synthetic data only</small>
          </div>
          <nav className="site-nav" aria-label="Views">
            <NavLinks />
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
