import type { SessionUser } from "@/lib/auth/session";
import type { ActorContext } from "@/lib/contracts/service";

/**
 * Shared action plumbing (§30).
 *
 * Kept out of the `"use server"` modules on purpose: a server-action file may only
 * export async functions, so the state envelope and the actor mapping live here.
 */

export interface ActionState {
  ok: boolean;
  error?: string;
  message?: string;
  missingFields?: string[];
  redirectTo?: string;
}

export const EMPTY_ACTION_STATE: ActionState = { ok: false };

/** Session user → domain actor. Identity and role never come from the client. */
export function actorContext(user: SessionUser): ActorContext {
  return { kind: "user", id: user.id, role: user.role, fullName: user.fullName, email: user.email };
}
