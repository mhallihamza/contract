import type { PrismaClient } from "@prisma/client";
import { hashPassword } from "../../src/lib/auth/hash";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "../../src/lib/auth/demo-accounts";

export async function seedUsers(db: PrismaClient) {
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const admin = await db.user.upsert({
    where: { email: DEMO_ACCOUNTS.admin },
    update: { passwordHash, role: "ADMIN", status: "ACTIVE" },
    create: {
      email: DEMO_ACCOUNTS.admin,
      fullName: "Hamza Benjelloun",
      phone: "+212 661 112233",
      role: "ADMIN",
      status: "ACTIVE",
      preferredLanguage: "FR",
      passwordHash,
      profile: {
        create: {
          city: "Rabat",
          addressLine: "Avenue Mohammed V",
          nationalId: "A102030",
        },
      },
    },
  });

  const lawyerA = await db.user.upsert({
    where: { email: DEMO_ACCOUNTS.lawyerA },
    update: { passwordHash, role: "LAWYER", status: "ACTIVE" },
    create: {
      email: DEMO_ACCOUNTS.lawyerA,
      fullName: "Me. Karim El Fassi",
      phone: "+212 662 334455",
      role: "LAWYER",
      status: "ACTIVE",
      preferredLanguage: "FR",
      passwordHash,
      lawyerProfile: {
        create: {
          barNumber: "BAR-CAS-1042",
          specializations: ["RENTAL", "SERVICES", "CONFIDENTIALITY"],
          languages: ["FR", "AR"],
          jurisdictions: ["MA"],
          city: "Casablanca",
          maxConcurrentCases: 10,
          active: true,
          notes: "Spécialiste baux d'habitation et contrats commerciaux.",
        },
      },
    },
  });

  const lawyerB = await db.user.upsert({
    where: { email: DEMO_ACCOUNTS.lawyerB },
    update: { passwordHash, role: "LAWYER", status: "ACTIVE" },
    create: {
      email: DEMO_ACCOUNTS.lawyerB,
      fullName: "Me. Amina Tazi",
      phone: "+212 663 556677",
      role: "LAWYER",
      status: "ACTIVE",
      preferredLanguage: "AR",
      passwordHash,
      lawyerProfile: {
        create: {
          barNumber: "BAR-RAB-2088",
          specializations: ["RENTAL", "SALE"],
          languages: ["AR"],
          jurisdictions: ["MA"],
          city: "Rabat",
          maxConcurrentCases: 10,
          active: true,
          notes: "Avocate au barreau de Rabat.",
        },
      },
    },
  });

  const lawyerC = await db.user.upsert({
    where: { email: DEMO_ACCOUNTS.lawyerC },
    update: { passwordHash, role: "LAWYER", status: "ACTIVE" },
    create: {
      email: DEMO_ACCOUNTS.lawyerC,
      fullName: "Me. Youssef Berrada",
      phone: "+212 664 778899",
      role: "LAWYER",
      status: "ACTIVE",
      preferredLanguage: "FR",
      passwordHash,
      lawyerProfile: {
        create: {
          barNumber: "BAR-CAS-3150",
          specializations: ["SERVICES", "CONFIDENTIALITY", "SALE"],
          languages: ["FR"],
          jurisdictions: ["MA"],
          city: "Casablanca",
          maxConcurrentCases: 10,
          active: true,
          notes: "Droit des affaires et contrats informatiques.",
        },
      },
    },
  });

  const client1 = await db.user.upsert({
    where: { email: DEMO_ACCOUNTS.client1 },
    update: { passwordHash, role: "CLIENT", status: "ACTIVE" },
    create: {
      email: DEMO_ACCOUNTS.client1,
      fullName: "Mehdi Alami",
      phone: "+212 670 123456",
      role: "CLIENT",
      status: "ACTIVE",
      preferredLanguage: "FR",
      passwordHash,
      profile: {
        create: {
          partyType: "INDIVIDUAL",
          nationalId: "BK678901",
          city: "Casablanca",
          addressLine: "14 Boulevard d'Anfa",
        },
      },
    },
  });

  const client2 = await db.user.upsert({
    where: { email: DEMO_ACCOUNTS.client2 },
    update: { passwordHash, role: "CLIENT", status: "ACTIVE" },
    create: {
      email: DEMO_ACCOUNTS.client2,
      fullName: "Sara Bennani",
      phone: "+212 671 987654",
      role: "CLIENT",
      status: "ACTIVE",
      preferredLanguage: "AR",
      passwordHash,
      profile: {
        create: {
          partyType: "COMPANY",
          companyName: "Atlas Digital SARL",
          companyTaxId: "ICE-002345678000091",
          legalForm: "SARL",
          city: "Tanger",
          addressLine: "Zone Franche Tanger Med",
        },
      },
    },
  });

  return { admin, lawyerA, lawyerB, lawyerC, client1, client2 };
}
