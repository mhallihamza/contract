/**
 * ⚠️ TEMPORARY MARKETING CONTENT — public pages only.
 *
 * The homepage reads the hero photograph and every routing target from here, so
 * swapping the placeholder material for the real one never touches JSX:
 *
 *   - `HERO_PHOTO` → replace with a commissioned shoot
 *   - `USE_CASES`  → the six families of the grid (§9–§11), icon key + target
 *   - `SOCIAL_LINKS` → the real accounts once they exist
 *
 * Nothing here states a legal claim, a certification or a customer figure.
 */

/**
 * Editorial photography of the hero only (Pexels license: free for commercial
 * use, no attribution required). The category grid shows no photography at all:
 * its cards are icon zones. Paths are served from `/public`.
 */
export const HERO_PHOTO = "/marketing/photos/hero-editorial.jpg";

/** Last-resort illustration for a document without its own photo. */
export const DOCUMENT_IMAGE_FALLBACK = "/marketing/document-generic.svg";

/**
 * The six use cases of the homepage grid.
 *
 * `href` always points at a real destination: the families that exist in the
 * catalogue deep-link into their database category, the two families that are
 * not published yet hand the visitor to the assistant — which states plainly
 * when a document is not supported instead of producing an unsuitable one.
 */
export interface UseCase {
  id: string;
  /** Icon key resolved inside the component (keeps lucide imports there). */
  icon: "building" | "handshake" | "briefcase" | "car" | "fileUser" | "shield";
  href: string;
}

export const USE_CASES: readonly UseCase[] = [
  { id: "immobilier", icon: "building", href: "/contracts?category=RENTAL" },
  { id: "commercial", icon: "handshake", href: "/contracts?category=SERVICES" },
  { id: "entreprise", icon: "briefcase", href: "/contracts?category=CONFIDENTIALITY" },
  { id: "automobile", icon: "car", href: "/assistant" },
  { id: "identite", icon: "fileUser", href: "/assistant" },
  { id: "confidentialite", icon: "shield", href: "/contracts?category=CONFIDENTIALITY" },
];

/** TEMPORARY placeholder links — replace with the real social accounts.
 *  lucide v1 no longer ships brand glyphs, so the circles use generic
 *  same-family icons; swap for a brand icon set when the accounts exist. */
export const SOCIAL_LINKS: readonly {
  href: string;
  label: string;
  icon: "share" | "message" | "camera";
}[] = [
  { href: "#", label: "LinkedIn", icon: "share" },
  { href: "#", label: "Facebook", icon: "message" },
  { href: "#", label: "Instagram", icon: "camera" },
];
