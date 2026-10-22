import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Digital AI Employee Platform",
  description: "A multi-industry agentic AI avatar platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
