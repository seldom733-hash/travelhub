const { Client } = require('pg');
const fs = require('fs');

const DB_URL = 'postgresql://neondb_owner:npg_wjivyFCxm7s5@ep-billowing-bird-auw8z5zf-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function query(sql) {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  try {
    const result = await client.query(sql);
    return result;
  } finally {
    await client.end();
  }
}

async function main() {
  // Clean schema
  await query('DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO neondb_owner; GRANT ALL ON SCHEMA public TO public;');
  console.log('Schema cleaned');
  await sleep(3000);

  const raw = fs.readFileSync('prisma/neon-init-raw.sql', 'utf8');
  const sql = raw.split('\n').filter(l => !l.trim().startsWith('--')).join('\n');
  const stmts = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
  console.log('Total statements:', stmts.length);

  let success = 0, skipped = 0, errors = 0;
  for (let i = 0; i < stmts.length; i++) {
    const s = stmts[i].replace(/\s+/g, ' ').trim();
    if (!s) continue;
    try {
      await query(s + ';');
      success++;
      process.stdout.write('.');
    } catch (e) {
      const code = e.code || '';
      if (code === '42710' || code === '42P07' || code === '42P16') {
        skipped++;
      } else {
        console.error('\n[' + (i+1) + '/' + stmts.length + '] Error[' + code + ']:', (e.message || '').substring(0, 120));
        errors++;
      }
    }
    if ((i + 1) % 10 === 0) process.stdout.write('[' + (i+1) + '] ');
    await sleep(500);
  }
  console.log('\nDone! Success:', success, 'Skipped:', skipped, 'Errors:', errors);
  const t = await query("SELECT count(*) FROM information_schema.tables WHERE table_schema='public'");
  const e = await query("SELECT count(*) FROM pg_type WHERE typtype='e'");
  console.log('Tables:', t.rows[0].count, 'Enums:', e.rows[0].count);
}
main().catch(e => { console.error(e.message); process.exit(1); });
