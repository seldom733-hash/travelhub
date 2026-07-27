import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Fix NULL tourCategory values
  const result = await prisma.service.updateMany({
    where: { type: 'TOUR', tourCategory: null },
    data: { tourCategory: 'ONE_DAY' as any },
  });
  console.log(`Updated ${result.count} tours to ONE_DAY`);

  // Verify
  const cats = await prisma.service.groupBy({
    by: ['tourCategory'],
    where: { type: 'TOUR' },
    _count: true,
  });
  cats.forEach(c => console.log(`  ${c.tourCategory ?? 'NULL'}: ${c._count}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
