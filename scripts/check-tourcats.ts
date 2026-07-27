import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const r = await p.$queryRawUnsafe(`SELECT "tourCategory", COUNT(*)::int as cnt FROM services WHERE type='TOUR' GROUP BY "tourCategory"`);
  console.log(JSON.stringify(r));
  await p.$disconnect();
})();
