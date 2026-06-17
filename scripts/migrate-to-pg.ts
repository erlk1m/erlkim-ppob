import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(rootDir, '.env') });

const dbFile = path.join(rootDir, 'apps', 'api', 'storage', 'db.json');

async function migrate() {
  const { db, categories, products, paymentMethods, siteSettings, themeSettings } = await import('@erlkim-ppob/database');

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is missing in .env');
    return;
  }
  if (!fs.existsSync(dbFile)) {
    console.log('db.json not found, nothing to migrate.');
    return;
  }

  console.log('Reading db.json...');
  const data = JSON.parse(fs.readFileSync(dbFile, 'utf8'));

  console.log('Migrating Categories...');
  for (const c of data.categories || []) {
    await db.insert(categories).values({
      name: c.name,
      slug: c.slug,
      description: c.description || null,
      icon: c.icon || null,
      type: c.type || 'prepaid',
      isActive: c.isActive !== false
    }).onConflictDoNothing();
  }

  console.log('Migrating Payment Methods...');
  for (const pm of data.paymentMethods || []) {
    await db.insert(paymentMethods).values({
      id: pm.id,
      provider: pm.provider,
      name: pm.name,
      merchantName: pm.merchantName || null,
      adminFee: pm.adminFee || 0,
      qrisImageUrl: pm.qrisImageUrl || null,
      qrisPayload: pm.qrisPayload || null,
      isEnabled: pm.isEnabled !== false
    }).onConflictDoNothing();
  }

  // Add more logic here for products and orders as needed
  console.log('Migration completed successfully.');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
