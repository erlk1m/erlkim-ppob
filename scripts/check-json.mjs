import fs from 'node:fs';

for (const file of ['package.json', 'apps/api/package.json', 'apps/web/package.json', 'apps/admin/package.json']) {
  const raw = fs.readFileSync(file, 'utf8');
  JSON.parse(raw);
  console.log(`${file} OK`);
}
