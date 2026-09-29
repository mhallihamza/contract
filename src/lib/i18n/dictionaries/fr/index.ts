import { commonFr } from "./common";
import { statusesFr } from "./statuses";
import { landingFr } from "./landing";
import { clientFr } from "./client";
import { flowFr } from "./flow";
import { afterFr } from "./after";
import { lawyerFr } from "./lawyer";
import { adminFr } from "./admin";
import { adminKnowledgeFr } from "./admin-knowledge";
import { publicFr } from "./public-flow";

/** The French dictionary is the reference shape for every other locale. */
export const fr = {
  common: commonFr,
  statuses: statusesFr,
  landing: landingFr,
  client: { ...clientFr, ...flowFr, ...afterFr },
  lawyer: lawyerFr,
  admin: { ...adminFr, ...adminKnowledgeFr },
  public: publicFr,
} as const;
