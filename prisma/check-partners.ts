import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const partners = await prisma.user.findMany({
    where: { role: "PARTNER" },
    select: { id: true, email: true, firstName: true, lastName: true, partnerType: true },
    orderBy: { email: "asc" },
  });

  console.log("═══════════════════════════════════════════════════════════");
  console.log("  ПРИВЯЗКА УСЛУГ К ПАРТНЁРАМ");
  console.log("═══════════════════════════════════════════════════════════");

  let totalServices = 0;
  for (const p of partners) {
    const count = await prisma.service.count({ where: { providerId: p.id } });
    totalServices += count;
    const bar = "█".repeat(Math.min(count, 50));
    console.log(`${p.email.padEnd(35)} (${p.partnerType?.padEnd(22)}) — ${String(count).padStart(4)} услуг  ${bar}`);
  }

  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  ИТОГО: ${totalServices} услуг分布在 ${partners.length} партнёрах`);
  console.log("═══════════════════════════════════════════════════════════");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
