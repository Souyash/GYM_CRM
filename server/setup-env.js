import fs from 'fs';
import path from 'path';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'ironvault_gym_super_secure_key_2026';
}

// If DATABASE_URL points to a local file with subdirectories, ensure parent directory exists
if (process.env.DATABASE_URL.startsWith('file:')) {
  try {
    const rawPath = process.env.DATABASE_URL.replace(/^file:/, '');
    const absPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);
    const dir = path.dirname(absPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created database directory: ${dir}`);
    }
  } catch (err) {
    console.warn(`⚠️ Could not pre-create database directory (${err.message}). Falling back to local data/dev.db`);
    process.env.DATABASE_URL = 'file:./data/dev.db';
    const fallbackDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(fallbackDir)) {
      fs.mkdirSync(fallbackDir, { recursive: true });
    }
  }
}

const envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, `DATABASE_URL="${process.env.DATABASE_URL}"\nJWT_SECRET="${process.env.JWT_SECRET}"\n`);
  console.log('✅ Initialized default .env configuration');
}
