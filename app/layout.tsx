import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
// Validate the catalog during next build before any page can ship.
import "../lib/catalog";

export const metadata: Metadata = {
  title: "STEMBridge AI",
  description: "Explore STEM careers and find out what to learn first.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <header className="site-header">
          <div className="site-container brand">
            <span className="brand-mark" aria-hidden="true"><span /></span>
            <span>STEMBridge AI</span>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div className="site-container">
            <p><strong>Guidance only.</strong> Talk with a teacher or counselor.</p>
            <p>We don’t save what you type. Your interests are used only to show results and are not shared with anyone. Our hosting provider keeps basic technical logs for a short time.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
