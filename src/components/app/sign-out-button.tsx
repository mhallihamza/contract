"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Signs out through the API route, then returns to the public site. */
export function SignOutButton({ label }: { label: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await fetch("/api/auth/sign-out", { method: "POST" }).catch(() => undefined);
        router.push("/");
        router.refresh();
      }}
      className="gap-1.5 text-xs"
    >
      <LogOut className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
      {label}
    </Button>
  );
}
