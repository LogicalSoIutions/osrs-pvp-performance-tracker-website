import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OSRS PvP Fight Tracker",
  description: "PvP fight tracker with bundled Next.js frontend and SSE updates",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
