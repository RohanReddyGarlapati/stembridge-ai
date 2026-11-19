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
      <body>{children}</body>
    </html>
  );
}
