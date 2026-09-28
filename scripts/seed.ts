import { PrismaClient } from "@prisma/client";
import { seedUsers } from "./seed-data/users";
import { seedLegalSources } from "./seed-data/sources";
import { seedContractTypes } from "./seed-data/contract-types";
import { seedLegalRules } from "./seed-data/legal-rules";
import { seedClauses } from "./seed-data/clauses";
import { seedTemplates } from "./seed-data/templates";
import { seedDemoCaseA } from "./seed-data/demo-case-a";
import { seedDemoCaseB } from "./seed-data/demo-case-b";
import { seedDemoCaseC } from "./seed-data/demo-case-c";
import { seedDemoCaseD } from "./seed-data/demo-case-d";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Starting Morocco Legal Platform database seed...\n");

  // 1. Users
  console.log("1. Seeding users and lawyer profiles (§51, §52)...");
  const users = await seedUsers(db);
  console.log("   ✓ Admin, 3 Lawyers (A, B, C with distinct capacities), 2 Clients created.");

  // 2. Legal Sources
  console.log("2. Seeding verified legal sources (§12, §13)...");
  const sources = await seedLegalSources(db, users.admin.id);
  console.log("   ✓ Loi 67-12, DOC 1913, Loi 49-16, Loi 39-08 verified.");

  // 3. Contract Types
  console.log("3. Seeding contract types catalogue (§14)...");
  const types = await seedContractTypes(db);
  console.log("   ✓ 5 Contract types seeded (Lease, Freelance, NDA, Commercial, Real Estate).");

  // 4. Legal Rules
  console.log("4. Seeding deterministic legal rules (§10, §11, §34, §55)...");
  const rules = await seedLegalRules(
    db,
    {
      typeResidentialLease: types.typeResidentialLease,
      typeFreelanceService: types.typeFreelanceService,
      typeCommercialLease: types.typeCommercialLease,
      typeRealEstateSale: types.typeRealEstateSale,
    },
    sources,
    users.admin.id,
  );
  console.log("   ✓ 6 Rules configured: Self-Service, Lawyer Optional, Lawyer Required, Signature Required, Specialist.");

  // 5. Clauses & Templates
  console.log("5. Seeding clauses and templates (§15)...");
  const clauses = await seedClauses(db);
  const templates = await seedTemplates(db, types.typeResidentialLease.id, clauses);
  console.log("   ✓ Templates, bilingual clauses, and conditional clauses linked.");

  // 6. Demo Contracts (Flows A, B, C, D)
  console.log("6. Seeding realistic demonstration contracts for all 4 product flows (§51, §67)...");

  // Flow A: Self-Service
  const contractA = await seedDemoCaseA(
    db,
    types.typeResidentialLease.id,
    templates.versionLease.id,
    sources.sourceLoi6712.id,
    rules.ruleLeaseStandard.id,
    users.client1.id,
  );
  console.log(`   ✓ Flow A (Self-Service Completed): ${contractA.reference}`);

  // Flow B: Lawyer Optional Under Review
  const contractB = await seedDemoCaseB(
    db,
    types.typeResidentialLease.id,
    templates.versionLease.id,
    users.client1.id,
    users.lawyerA.id,
  );
  console.log(`   ✓ Flow B (Lawyer Optional Under Review): ${contractB.reference}`);

  // Flow C: Lawyer Required Pending Client
  const contractC = await seedDemoCaseC(
    db,
    types.typeFreelanceService.id,
    users.client2.id,
  );
  console.log(`   ✓ Flow C (Lawyer Required Pending Payment): ${contractC.reference}`);

  // Flow D: Lawyer Signature Required
  const contractD = await seedDemoCaseD(
    db,
    types.typeCommercialLease.id,
    users.client2.id,
    users.lawyerA.id,
  );
  console.log(`   ✓ Flow D (Lawyer Signature Required Pending Signature): ${contractD.reference}`);

  console.log("\n=======================================================");
  console.log("✅ Seed completed successfully!");
  console.log("=======================================================");
  console.log("Demo credentials:");
  console.log("  • Admin:    admin@morocco-legal-platform.test     (Passw0rd!demo)");
  console.log("  • Lawyer A: lawyer.a@morocco-legal-platform.test  (Passw0rd!demo) [Casablanca, French/Arabic]");
  console.log("  • Lawyer B: lawyer.b@morocco-legal-platform.test  (Passw0rd!demo) [Rabat, Arabic]");
  console.log("  • Lawyer C: lawyer.c@morocco-legal-platform.test  (Passw0rd!demo) [Casablanca, French, Business]");
  console.log("  • Client 1: client1@morocco-legal-platform.test   (Passw0rd!demo) [Individual]");
  console.log("  • Client 2: client2@morocco-legal-platform.test   (Passw0rd!demo) [Company: Atlas Digital SARL]");
  console.log("=======================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
