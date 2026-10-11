import type { Metadata } from "next";
import { Cairo, Inter, JetBrains_Mono } from "next/font/google";
import { getServerI18n } from "@/lib/i18n/server";
import "./globals.css";

/**
 * Typography is wired here because globals.css references these three
 * variables by name (--font-inter / --font-cairo / --font-jetbrains).
 * Inter carries the Latin interface, Cairo takes over Arabic glyphs so the
 * RTL pages never drop to a system face, JetBrains Mono carries reference
 * numbers and timestamps. `display: swap` keeps first paint instant.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MOROCCO LEGAL PLATFORM — Plateforme Juridique Maroc",
    template: "%s | MOROCCO LEGAL PLATFORM",
  },
  description: "Plateforme juridique marocaine : de votre besoin au contrat final.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale, dir } = await getServerI18n();

  return (
    <html
      lang={locale}
      dir={dir}
      className={`h-full ${inter.variable} ${cairo.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        {children}
      </body>
    </html>
  );
}
