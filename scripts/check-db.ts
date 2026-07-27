import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Service type counts
  const types = await prisma.service.groupBy({
    by: ['type'],
    _count: true,
  });
  console.log('=== Service types ===');
  types.forEach(t => console.log(`  ${t.type}: ${t._count}`));

  // Tour category counts
  const cats = await prisma.service.groupBy({
    by: ['tourCategory'],
    where: { type: 'TOUR' },
    _count: true,
  });
  console.log('\n=== Tour categories (TOUR type only) ===');
  cats.forEach(c => console.log(`  ${c.tourCategory ?? 'NULL'}: ${c._count}`));

  // Sample tours
  const sampleTours = await prisma.service.findMany({
    where: { type: 'TOUR' },
    select: { id: true, title: true, tourCategory: true, city: true, country: true },
    take: 10,
  });
  console.log('\n=== Sample tours (first 10) ===');
  sampleTours.forEach(t => console.log(`  [${t.tourCategory ?? 'NULL'}] ${t.title} - ${t.city}, ${t.country}`));

  // Hotel count
  const hotelCount = await prisma.service.count({ where: { type: 'HOTEL' } });
  console.log(`\n=== Hotels: ${hotelCount} ===`);

  // Sample hotels with stars
  const sampleHotels = await prisma.service.findMany({
    where: { type: 'HOTEL' },
    select: { id: true, title: true, description: true },
    take: 5,
  });
  console.log('\n=== Sample hotels (first 5) ===');
  sampleHotels.forEach(h => {
    const stars = (h.description.match(/★/g) || []).length;
    console.log(`  ${h.title} (★x${stars})`);
  });

  // TourHotel data for star filtering
  const tourHotels = await prisma.$queryRawUnsafe(
    'SELECT COUNT(*)::int as count FROM tour_hotels WHERE "hotelClass" IS NOT NULL'
  ) as any[];
  console.log(`\n=== TourHotel records with hotelClass: ${tourHotels[0]?.count ?? 0} ===`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
