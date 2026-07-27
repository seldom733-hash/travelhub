import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const r = await prisma.$executeRawUnsafe(
    "UPDATE services SET \"tourCategory\" = 'ONE_DAY' WHERE \"tourCategory\" IS NULL AND type = 'TOUR'"
  );
  console.log(`Updated ${r} TOUR services to ONE_DAY`);

  const oneDay = await prisma.service.count({ where: { type: "TOUR", tourCategory: "ONE_DAY" as any } });
  const multiDay = await prisma.service.count({ where: { type: "TOUR", tourCategory: "MULTI_DAY" as any } });
  console.log(`ONE_DAY: ${oneDay}, MULTI_DAY: ${multiDay}, Total: ${oneDay + multiDay}`);
}

main().then(() => prisma.$disconnect()).catch((e) => { console.error(e); process.exit(1); });
