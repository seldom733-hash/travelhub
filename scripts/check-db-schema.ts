import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [svcCols, auditTables] = await Promise.all([
    prisma.$queryRawUnsafe<{ column_name: string; data_type: string }[]>(
      `SELECT column_name, data_type FROM information_schema.columns 
       WHERE table_name='services' AND column_name IN 
       ('moderationStatus','moderationReason','moderatedAt','moderatedById','isFeatured','isHot')`
    ),
    prisma.$queryRawUnsafe<{ table_name: string }[]>(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_name LIKE '%audit%' OR table_name LIKE '%Audit%'`
    ),
  ]);

  console.log("Service columns found:", svcCols.length);
  svcCols.forEach(c => console.log(`  ${c.column_name} (${c.data_type})`));

  console.log("Audit tables found:", auditTables.length);
  auditTables.forEach(t => console.log(`  ${t.table_name}`));

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
