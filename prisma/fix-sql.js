const fs = require('fs');
let sql = fs.readFileSync('prisma/neon-init-raw.sql', 'utf8');

// Split into lines for processing
const lines = sql.split('\n');
const output = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Match CREATE TYPE "Name" AS ENUM (...);
  const enumMatch = line.match(/^CREATE TYPE "(\w+)" AS ENUM \((.+?)\);$/);
  if (enumMatch) {
    const [, name, values] = enumMatch;
    output.push('DO $$ BEGIN');
    output.push(`  CREATE TYPE "${name}" AS ENUM (${values});`);
    output.push('EXCEPTION WHEN duplicate_object THEN NULL;');
    output.push('END $$;');
    continue;
  }
  
  // Match CREATE TABLE
  if (line.match(/^CREATE TABLE "(\w+)"/)) {
    output.push(line.replace('CREATE TABLE "', 'CREATE TABLE IF NOT EXISTS "'));
    continue;
  }
  
  // Match CREATE UNIQUE INDEX
  if (line.match(/^CREATE UNIQUE INDEX "(\w+)"/)) {
    output.push(line.replace('CREATE UNIQUE INDEX "', 'CREATE UNIQUE INDEX IF NOT EXISTS "'));
    continue;
  }
  
  // Match CREATE INDEX
  if (line.match(/^CREATE INDEX "(\w+)"/)) {
    output.push(line.replace('CREATE INDEX "', 'CREATE INDEX IF NOT EXISTS "'));
    continue;
  }
  
  output.push(line);
}

const result = output.join('\n');
fs.writeFileSync('prisma/neon-init.sql', result);
console.log('SQL file fixed successfully');
console.log('Lines:', result.split('\n').length);
