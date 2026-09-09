import fs from 'fs';
import path from 'path';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'ironvault_gym_super_secure_key_2026';
}

const envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, `DATABASE_URL="${process.env.DATABASE_URL}"\nJWT_SECRET="${process.env.JWT_SECRET}"\n`);
  console.log('✅ Initialized default .env configuration');
}

