import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, recordSignIn } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const { email, password } = (await request.json()) as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "MISSING_CREDENTIALS" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    await createSession(user.id);
    await recordSignIn(user.id, user.role);

    let redirectUrl = "/app/dashboard";
    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
      redirectUrl = "/admin/dashboard";
    } else if (user.role === "LAWYER") {
      redirectUrl = "/lawyer/workspace";
    }

    return NextResponse.json({ ok: true, role: user.role, redirectUrl });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
