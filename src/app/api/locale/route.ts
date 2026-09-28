import { NextResponse } from "next/server";
import { LOCALE_COOKIE, isLocale, defaultLocale } from "@/lib/i18n/config";

export async function POST(request: Request) {
  try {
    const { locale } = (await request.json()) as { locale?: string };
    const valid = isLocale(locale) ? locale : defaultLocale;

    const response = NextResponse.json({ ok: true, locale: valid });
    response.cookies.set(LOCALE_COOKIE, valid, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    });

    return response;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

