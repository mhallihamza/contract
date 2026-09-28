import type { Metadata } from "next";
import { getServerI18n } from "@/lib/i18n/server";
import "./globals.css";

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
    <html lang={locale} dir={dir} className="h-full">
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        {children}
      </body>
    </html>
  );
}
