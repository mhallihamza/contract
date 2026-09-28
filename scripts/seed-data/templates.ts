import type { PrismaClient } from "@prisma/client";

export async function seedTemplates(
  db: PrismaClient,
  typeResidentialLeaseId: string,
  clauses: {
    clausePreamble: { id: string };
    clauseObject: { id: string };
    clauseDuration: { id: string };
    clauseRent: { id: string };
    clauseDeposit: { id: string };
  },
) {
  const templateLease = await db.contractTemplate.upsert({
    where: { code: "TMPL-MA-RESIDENTIAL-LEASE" },
    update: {},
    create: {
      code: "TMPL-MA-RESIDENTIAL-LEASE",
      contractTypeId: typeResidentialLeaseId,
      nameFr: "Modèle type de bail d'habitation Loi 67-12",
      nameAr: "النموذج القياسي لعقد الكراء السكني قانون 67.12",
    },
  });

  const versionLease = await db.contractTemplateVersion.upsert({
    where: {
      templateId_versionNumber: {
        templateId: templateLease.id,
        versionNumber: 1,
      },
    },
    update: { status: "ACTIVE" },
    create: {
      templateId: templateLease.id,
      versionNumber: 1,
      language: "FR",
      status: "ACTIVE",
      publishedAt: new Date(),
      variables: [
        { key: "landlord_name", labelFr: "Nom du bailleur", labelAr: "اسم المكري", type: "TEXT", required: true },
        { key: "tenant_name", labelFr: "Nom du locataire", labelAr: "اسم المكتري", type: "TEXT", required: true },
        { key: "property_address", labelFr: "Adresse", labelAr: "العنوان", type: "TEXT", required: true },
        { key: "rent_amount", labelFr: "Loyer", labelAr: "الوجيبة", type: "NUMBER", required: true },
        { key: "duration_months", labelFr: "Durée", labelAr: "المدة", type: "NUMBER", required: true },
        { key: "start_date", labelFr: "Date de début", labelAr: "تاريخ البدء", type: "DATE", required: true },
      ],
      sections: [
        { title: "Préambule", position: 1 },
        { title: "Conditions principales", position: 2 },
      ],
    },
  });

  await db.contractTemplate.update({
    where: { id: templateLease.id },
    data: { activeVersionId: versionLease.id },
  });

  // Attach clauses
  await db.templateClause.upsert({
    where: { templateVersionId_clauseId: { templateVersionId: versionLease.id, clauseId: clauses.clausePreamble.id } },
    update: {},
    create: { templateVersionId: versionLease.id, clauseId: clauses.clausePreamble.id, position: 1, requirement: "REQUIRED" },
  });
  await db.templateClause.upsert({
    where: { templateVersionId_clauseId: { templateVersionId: versionLease.id, clauseId: clauses.clauseObject.id } },
    update: {},
    create: { templateVersionId: versionLease.id, clauseId: clauses.clauseObject.id, position: 2, requirement: "REQUIRED" },
  });
  await db.templateClause.upsert({
    where: { templateVersionId_clauseId: { templateVersionId: versionLease.id, clauseId: clauses.clauseDuration.id } },
    update: {},
    create: { templateVersionId: versionLease.id, clauseId: clauses.clauseDuration.id, position: 3, requirement: "REQUIRED" },
  });
  await db.templateClause.upsert({
    where: { templateVersionId_clauseId: { templateVersionId: versionLease.id, clauseId: clauses.clauseRent.id } },
    update: {},
    create: { templateVersionId: versionLease.id, clauseId: clauses.clauseRent.id, position: 4, requirement: "REQUIRED" },
  });
  await db.templateClause.upsert({
    where: { templateVersionId_clauseId: { templateVersionId: versionLease.id, clauseId: clauses.clauseDeposit.id } },
    update: {},
    create: {
      templateVersionId: versionLease.id,
      clauseId: clauses.clauseDeposit.id,
      position: 5,
      requirement: "CONDITIONAL",
      condition: { field: "securityDepositMad", operator: "GREATER_THAN", value: 0 },
    },
  });

  return { templateLease, versionLease };
}
