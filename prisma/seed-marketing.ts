import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const channels = ["google", "instagram", "facebook", "tiktok", "email", "direct", "referral", "youtube", "telegram"];
  const eventTypes = ["visit", "register", "view_service", "start_checkout", "complete_booking"];
  const campaigns = ["summer_2025", "antalya_tours", "dubai_luxury", "greece_weekend", "easter_sale", "new_year_2025", "valentines", "black_friday"];
  const utmMediums = ["cpc", "social", "email", "organic", "banner", "video", "influencer"];

  const events: any[] = [];
  for (let d = 0; d < 30; d++) {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - d);
    const count = 40 + Math.floor(Math.random() * 60);
    for (let i = 0; i < count; i++) {
      const ch = channels[Math.floor(Math.random() * channels.length)];
      const et = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const cost = et === "visit" ? Math.round(Math.random() * 5 * 100) / 100 : Math.round(Math.random() * 15 * 100) / 100;
      const revenue = et === "complete_booking" ? Math.round((Math.random() * 800 + 100) * 100) / 100 : 0;
      const dt = new Date(baseDate);
      dt.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
      events.push({
        channel: ch,
        campaign: campaigns[Math.floor(Math.random() * campaigns.length)],
        utmSource: channels[Math.floor(Math.random() * channels.length)],
        utmMedium: utmMediums[Math.floor(Math.random() * utmMediums.length)],
        utmCampaign: campaigns[Math.floor(Math.random() * campaigns.length)],
        sessionId: "sess_" + Math.random().toString(36).substr(2, 10),
        eventType: et,
        cost,
        revenue,
        createdAt: dt,
      });
    }
  }

  const BATCH = 200;
  let inserted = 0;
  for (let i = 0; i < events.length; i += BATCH) {
    await prisma.marketingEvent.createMany({ data: events.slice(i, i + BATCH) });
    inserted += Math.min(BATCH, events.length - i);
    process.stdout.write(`  ✍️ ${inserted}/${events.length}\r`);
  }
  console.log(`\n✍️ Inserted ${events.length} marketing events`);

  // Verify
  const count = await prisma.marketingEvent.count();
  console.log(`📊 Total marketing events: ${count}`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
