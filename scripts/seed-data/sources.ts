import type { PrismaClient } from "@prisma/client";

export async function seedLegalSources(db: PrismaClient, adminId: string) {
  const sourceLoi6712 = await db.legalSource.upsert({
    where: { code: "MA-LAW-67-12" },
    update: { verificationStatus: "VERIFIED" },
    create: {
      code: "MA-LAW-67-12",
      title: "Loi n° 67-12 relative aux baux d'habitation ou à usage professionnel",
      titleAr: "القانون رقم 67.12 المتعلق بتنظيم العلاقات التعاقدية بين المكري والمكتري للمحلات المعدة للسكنى أو للاستعمال المهني",
      sourceType: "LAW",
      lawNumber: "67-12",
      article: "Articles 1, 2, 3",
      officialUrl: "http://adala.justice.gov.ma/production/html/Fr/164391.htm",
      publisher: "Bulletin Officiel du Royaume du Maroc n° 6208",
      publicationDate: new Date("2013-11-28"),
      effectiveDate: new Date("2014-02-28"),
      jurisdiction: "MA",
      language: "FR",
      verificationStatus: "VERIFIED",
      verifiedById: adminId,
      verifiedAt: new Date(),
      notes: "Exigence impérative d'un écrit avec date certaine pour tout bail d'habitation > 30 jours (Art. 3).",
    },
  });

  const sourceDOC = await db.legalSource.upsert({
    where: { code: "MA-DOC-1913" },
    update: { verificationStatus: "VERIFIED" },
    create: {
      code: "MA-DOC-1913",
      title: "Dahir des Obligations et des Contrats (DOC) de 1913",
      titleAr: "ظهير الالتزامات والعقود لسنة 1913",
      sourceType: "LAW",
      lawNumber: "Dahir 9 Ramadan 1331",
      article: "Articles 230, 488, 723",
      officialUrl: "http://adala.justice.gov.ma/production/html/Fr/164390.htm",
      publisher: "Bulletin Officiel du Royaume du Maroc",
      publicationDate: new Date("1913-09-12"),
      effectiveDate: new Date("1913-09-12"),
      jurisdiction: "MA",
      language: "FR",
      verificationStatus: "VERIFIED",
      verifiedById: adminId,
      verifiedAt: new Date(),
      notes: "Socle général du droit des obligations et de la liberté contractuelle sous réserve des lois impératives.",
    },
  });

  const sourceLoi4916 = await db.legalSource.upsert({
    where: { code: "MA-LAW-49-16" },
    update: { verificationStatus: "VERIFIED" },
    create: {
      code: "MA-LAW-49-16",
      title: "Loi n° 49-16 relative aux baux d'immeubles ou de locaux loués à usage commercial, industriel ou artisanal",
      titleAr: "القانون رقم 49.16 المتعلق بكراء العقارات أو المحلات المخصصة للاستعمال التجاري أو الصناعي أو الحرفي",
      sourceType: "LAW",
      lawNumber: "49-16",
      article: "Article 3",
      officialUrl: "http://adala.justice.gov.ma/production/html/Fr/164392.htm",
      publisher: "Bulletin Officiel du Royaume du Maroc n° 6490",
      publicationDate: new Date("2016-08-11"),
      effectiveDate: new Date("2017-02-11"),
      jurisdiction: "MA",
      language: "FR",
      verificationStatus: "VERIFIED",
      verifiedById: adminId,
      verifiedAt: new Date(),
      notes: "Exigence d'un acte écrit à date certaine ou reçu par un professionnel habilité.",
    },
  });

  const sourceLoi3908 = await db.legalSource.upsert({
    where: { code: "MA-LAW-39-08" },
    update: { verificationStatus: "VERIFIED" },
    create: {
      code: "MA-LAW-39-08",
      title: "Loi n° 39-08 portant code des droits réels",
      titleAr: "القانون رقم 39.08 المتعلق بمدونة الحقوق العينية",
      sourceType: "LAW",
      lawNumber: "39-08",
      article: "Article 4",
      officialUrl: "http://adala.justice.gov.ma/production/html/Fr/164393.htm",
      publisher: "Bulletin Officiel du Royaume du Maroc n° 5998",
      publicationDate: new Date("2011-11-24"),
      effectiveDate: new Date("2012-05-24"),
      jurisdiction: "MA",
      language: "FR",
      verificationStatus: "VERIFIED",
      verifiedById: adminId,
      verifiedAt: new Date(),
      notes: "Acte notarié ou avocat agréé près la Cour de Cassation obligatoire pour les cessions immobilières (Art. 4).",
    },
  });

  return { sourceLoi6712, sourceDOC, sourceLoi4916, sourceLoi3908 };
}
