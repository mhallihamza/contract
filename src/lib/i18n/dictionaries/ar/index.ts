import type { Dictionary } from "../index";
import { commonAr } from "./common";
import { statusesAr } from "./statuses";
import { landingAr } from "./landing";
import { clientAr } from "./client";
import { flowAr } from "./flow";
import { afterAr } from "./after";
import { lawyerAr } from "./lawyer";
import { adminAr } from "./admin";
import { adminKnowledgeAr } from "./admin-knowledge";
import { publicAr } from "./public-flow";

/**
 * Arabic dictionary. It is typed against the French dictionary, so a missing
 * translation is a compile-time error instead of a runtime fallback.
 */
export const ar: Dictionary = {
  common: commonAr,
  statuses: statusesAr,
  landing: landingAr,
  client: { ...clientAr, ...flowAr, ...afterAr },
  lawyer: lawyerAr,
  admin: { ...adminAr, ...adminKnowledgeAr },
  public: publicAr,
};
