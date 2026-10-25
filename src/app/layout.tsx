import type { Metadata } from "next";
import { Cairo, Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import { appConfig } from "@/lib/config";
import { getServerI18n } from "@/lib/i18n/server";
import "./globals.css";

/**
 * Typography is wired here because globals.css references these variables by
 * name (--font-inter / --font-cairo / --font-jetbrains / --font-playfair).
 * Inter carries the Latin interface, Cairo takes over Arabic glyphs so the
 * RTL pages never drop to a system face, JetBrains Mono carries reference
 * numbers, prices and timestamps, and Playfair Display is the document voice:
 * act titles and signatures — never UI chrome. `display: swap` keeps first
 * paint instant.
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

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  style: ["normal", "italic"],
});

const BRAND = appConfig.brand.name;

export const metadata: Metadata = {
  title: {
    default: `${BRAND} — Votre juriste & fiduciaire en ligne au Maroc`,
    template: `%s | ${BRAND}`,
  },
  description:
    "Rédaction, vérification et formalisation de vos actes juridiques et administratifs au Maroc, en ligne.",
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
      className={`h-full ${inter.variable} ${cairo.variable} ${jetbrainsMono.variable} ${playfairDisplay.variable}`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        {children}
      </body>
    </html>
  );
}
