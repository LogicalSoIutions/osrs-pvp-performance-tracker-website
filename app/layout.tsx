import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PvP-Hub | OSRS PvP Performance Analytics",
    template: "%s | PvP-Hub",
  },
  description:
    "PvP-Hub is an OSRS PvP performance analytics platform for tracking fights, reviewing PvP stats, analyzing performance, and improving your Old School RuneScape PvP gameplay.",
  keywords: [
    "PvP-Hub",
    "OSRS",
    "Old School RuneScape",
    "OSRS PvP",
    "OSRS PKing",
    "PvP analytics",
    "PvP performance analytics",
    "OSRS fight tracker",
    "OSRS PvP tracker",
    "RuneScape PvP stats",
    "PKing tracker",
    "PvP fight history",
  ],
  applicationName: "PvP-Hub",
  authors: [{ name: "PvP-Hub" }],
  creator: "PvP-Hub",
  publisher: "PvP-Hub",
  metadataBase: new URL("https://osrs.pvp-hub.com"),
  openGraph: {
    title: "PvP-Hub | OSRS PvP Performance Analytics",
    description:
      "Track OSRS PvP fights, review performance data, analyze PvP stats, and improve your PKing with PvP-Hub.",
    url: "https://osrs.pvp-hub.com",
    siteName: "PvP-Hub",
    images: [
      {
        url: "/skull.png",
        width: 512,
        height: 512,
        alt: "PvP-Hub OSRS PvP Analytics",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "PvP-Hub | OSRS PvP Performance Analytics",
    description:
      "Track OSRS PvP fights, analyze PvP stats, and improve your PKing performance with PvP-Hub.",
    images: ["/skull.png"],
  },
  icons: {
    icon: [
      {
        url: "/skull.png",
        type: "image/png",
      },
    ],
    shortcut: "/skull.png",
    apple: "/skull.png",
  },
  category: "gaming",
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