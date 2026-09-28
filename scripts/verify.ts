import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🔍 Verifying Morocco Legal Platform database integrity...\n");

  const [
    userCount,
    lawyerCount,
    contractTypeCount,
    sourceCount,
    ruleCount,
    clauseCount,
    templateCount,
    contractCount,
    paymentCount,
    signatureReqCount,
    decisionCount,
  ] = await Promise.all([
    db.user.count(),
    db.lawyerProfile.count(),
    db.contractType.count(),
    db.legalSource.count(),
    db.legalRule.count(),
    db.clause.count(),
    db.contractTemplate.count(),
    db.contract.count(),
    db.payment.count(),
    db.signatureRequest.count(),
    db.routingDecision.count(),
  ]);

  console.log("Database Row Counts in legal_platform schema:");
  console.log(`  • Users:             ${userCount}`);
  console.log(`  • Lawyer Profiles:   ${lawyerCount}`);
  console.log(`  • Contract Types:    ${contractTypeCount}`);
  console.log(`  • Legal Sources:     ${sourceCount}`);
  console.log(`  • Legal Rules:       ${ruleCount}`);
  console.log(`  • Clauses:           ${clauseCount}`);
  console.log(`  • Templates:         ${templateCount}`);
  console.log(`  • Contracts:         ${contractCount}`);
  console.log(`  • Payments:          ${paymentCount}`);
  console.log(`  • Signature Requests:${signatureReqCount}`);
  console.log(`  • Routing Decisions: ${decisionCount}`);

  if (userCount < 6 || lawyerCount < 3 || contractCount < 4) {
    console.error("\n❌ Verification failed: Expected minimum seed rows not met.");
    process.exit(1);
  }

  // Verify the 4 demonstration contracts
  console.log("\nChecking Demonstration Contracts:");
  const contracts = await db.contract.findMany({
    include: {
      contractType: true,
      lawyerRequest: { include: { lawyer: true } },
      payments: true,
      signatureRequests: true,
    },
    orderBy: { reference: "asc" },
  });

  for (const c of contracts) {
    console.log(`  [${c.reference}] ${c.title}`);
    console.log(`    Status: ${c.status} | Route: ${c.route} | Type: ${c.contractType.code}`);
    if (c.payments.length > 0) {
      console.log(`    Payment: ${c.payments[0]!.status} (${c.payments[0]!.amount} ${c.payments[0]!.currency})`);
    }
    if (c.lawyerRequest?.lawyer) {
      console.log(`    Lawyer Assigned: ${c.lawyerRequest.lawyer.fullName} (${c.lawyerRequest.status})`);
    }
    if (c.signatureRequests.length > 0) {
      console.log(`    Signature Request: ${c.signatureRequests[0]!.status} (${c.signatureRequests[0]!.method})`);
    }
  }

  console.log("\n✅ Database verification successful! All systems operational.\n");
}

main()
  .catch((e) => {
    console.error("❌ Verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
