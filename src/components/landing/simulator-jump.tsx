"use client";

import type { ReactNode } from "react";

export type SimIntent = {
  mode: "create" | "verify";
  docType?: "bail" | "cdi" | "prestation";
  tier?: "sans" | "avocat" | "assistee";
};

/** The simulator listens for this event to preselect its mode/type/tier. */
export const SIM_EVENT = "wathiqa:sim";

/**
 * An anchor to the simulator that also announces the visitor's intent —
 * "Créer un document", "Vérifier un document", "Choisir la validation
 * avocat" — so the wizard opens on the right foot. Plain `#simulator` href
 * underneath, so it still works before hydration and with reduced motion.
 */
export function SimulatorJump({
  intent,
  children,
  className,
  title,
}: {
  intent: SimIntent;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  const onClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.dispatchEvent(new CustomEvent<SimIntent>(SIM_EVENT, { detail: intent }));
    const section = document.getElementById("simulator");
    if (!section) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    section.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  return (
    <a href="#simulator" onClick={onClick} className={className} title={title}>
      {children}
    </a>
  );
}
