import type { PrismaClient } from "@prisma/client";

export async function seedClauses(db: PrismaClient) {
  const clausePreamble = await db.clause.upsert({
    where: { code: "LEASE-PREAMBLE" },
    update: {},
    create: {
      code: "LEASE-PREAMBLE",
      nameFr: "Préambule et désignation des parties",
      nameAr: "الديباجة وتحديد الأطراف",
      bodyFr: "Entre les soussignés :\nLe Bailleur : {{landlord_name}}, demeurant à {{landlord_address}}, titulaire de la CIN n° {{landlord_cin}}.\nET\nLe Preneur : {{tenant_name}}, demeurant à {{tenant_address}}, titulaire de la CIN n° {{tenant_cin}}.\nIl a été convenu et arrêté ce qui suit conformément à la Loi n° 67-12 :",
      bodyAr: "بين الموقعين أسفله:\nالمكري: {{landlord_name}}، الساكن بـ {{landlord_address}}، والحامل لبطاقة التعريف الوطنية رقم {{landlord_cin}}.\nو\nالمكتري: {{tenant_name}}، الساكن بـ {{tenant_address}}، والحامل لبطاقة التعريف الوطنية رقم {{tenant_cin}}.\nتم الاتفاق والتعاقد على ما يلي طبقاً لمقتضيات القانون رقم 67.12:",
      status: "ACTIVE",
      variables: ["landlord_name", "landlord_address", "landlord_cin", "tenant_name", "tenant_address", "tenant_cin"],
    },
  });

  const clauseObject = await db.clause.upsert({
    where: { code: "LEASE-OBJECT" },
    update: {},
    create: {
      code: "LEASE-OBJECT",
      nameFr: "Objet du bail et désignation des lieux",
      nameAr: "موضوع الكراء ووصف المحل",
      bodyFr: "Le Bailleur donne à bail au Preneur, qui accepte, les locaux à usage d'habitation situés à {{property_address}}, {{property_city}}.",
      bodyAr: "يمنح المكري على سبيل الكراء السكني للمكتري، الذي يقبل ذلك، المحل الكائن بـ {{property_address}}، {{property_city}}.",
      status: "ACTIVE",
      variables: ["property_address", "property_city"],
    },
  });

  const clauseDuration = await db.clause.upsert({
    where: { code: "LEASE-DURATION" },
    update: {},
    create: {
      code: "LEASE-DURATION",
      nameFr: "Durée du bail",
      nameAr: "مدة الكراء",
      bodyFr: "Le présent contrat est consenti et accepté pour une durée ferme de {{duration_months}} mois, commençant à courir à compter du {{start_date}}.",
      bodyAr: "أُبرم هذا العقد لمدة محددة قدرها {{duration_months}} شهراً، تسري ابتداءً من تاريخ {{start_date}}.",
      status: "ACTIVE",
      variables: ["duration_months", "start_date"],
    },
  });

  const clauseRent = await db.clause.upsert({
    where: { code: "LEASE-RENT" },
    update: {},
    create: {
      code: "LEASE-RENT",
      nameFr: "Loyer et charges",
      nameAr: "الوجيبة الكرائية والتحملات",
      bodyFr: "Le loyer mensuel est fixé à la somme de {{rent_amount}} dirhams (MAD), payable d'avance le 1er de chaque mois.",
      bodyAr: "حُددت الوجيبة الكرائية الشهرية في مبلغ {{rent_amount}} درهم مغربي، تؤدى مسبقاً في فاتح كل شهر.",
      status: "ACTIVE",
      variables: ["rent_amount"],
    },
  });

  const clauseDeposit = await db.clause.upsert({
    where: { code: "LEASE-DEPOSIT" },
    update: {},
    create: {
      code: "LEASE-DEPOSIT",
      nameFr: "Dépôt de garantie",
      nameAr: "ضمانة الكراء",
      bodyFr: "À titre de garantie de l'exécution des présentes, le Preneur verse ce jour au Bailleur la somme de {{security_deposit}} dirhams (MAD), correspondant au maximum légal de deux mois de loyer prévu par la loi 67-12.",
      bodyAr: "لضمان تنفيذ التزامات هذا العقد، يودع المكتري بين يدي المكري هذا اليوم مبلغ {{security_deposit}} درهماً، وفق الحد الأقصى المنصوص عليه قانوناً.",
      status: "ACTIVE",
      variables: ["security_deposit"],
    },
  });

  return {
    clausePreamble,
    clauseObject,
    clauseDuration,
    clauseRent,
    clauseDeposit,
  };
}
