import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const services = await prisma.service.findMany({
    take: 5,
    include: {
      provider: {
        select: { firstName: true, lastName: true, companyName: true, partnerType: true },
      },
    },
  });

  console.log("=== Provider data in services ===");
  for (const s of services) {
    const prov = s.provider;
    const name = prov.companyName || `${prov.firstName} ${prov.lastName}`;
    console.log(`${s.title} (${s.type}) | Provider: ${name} | partnerType: ${prov.partnerType}`);
  }

  // Check total with/without companyName
  const withCompany = await prisma.user.count({ where: { partnerType: { not: null }, companyName: { not: null } } });
  const withoutCompany = await prisma.user.count({ where: { partnerType: { not: null }, companyName: null } });
  console.log(`\nPartners with companyName: ${withCompany}`);
  console.log(`Partners without companyName: ${withoutCompany}`);
}

main().then(() => prisma.$disconnect()).catch((e) => { console.error(e); process.exit(1); });
