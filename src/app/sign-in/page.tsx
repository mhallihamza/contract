import { getServerI18n } from "@/lib/i18n/server";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth-form";

export const metadata = {
  title: "Connexion | Plateforme Juridique Maroc",
};

export default async function SignInPage() {
  const user = await getCurrentUser();
  if (user) {
    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") redirect("/admin/dashboard");
    if (user.role === "LAWYER") redirect("/lawyer/workspace");
    redirect("/app/dashboard");
  }

  const { locale, d } = await getServerI18n();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/20">
      <div className="w-full max-w-md mb-8 text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{d.common.appName}</h1>
        <p className="text-sm text-muted-foreground">{d.common.tagline}</p>
      </div>

      <SignInForm
        locale={locale}
        dict={{
          title: d.common.auth.signInTitle,
          subtitle: d.common.auth.signInSubtitle,
          email: d.common.auth.email,
          password: d.common.auth.password,
          submit: d.common.auth.signInAction,
          demoAccounts: d.common.auth.demoAccounts,
          demoNotice: d.common.auth.demoHint,
        }}
      />
    </main>
  );
}
