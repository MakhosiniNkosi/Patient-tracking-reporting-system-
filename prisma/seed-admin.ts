// Bootstraps the first ADMIN user directly through Prisma, so there's a
// way in before any account exists to call the now-guarded /auth/register.
//
// Usage (reads from env so the password never sits in shell history/logs):
//   ADMIN_EMAIL=admin@testclinic.co.za ADMIN_PASSWORD=... ADMIN_NAME="Your Name" \
//     npx tsx prisma/seed-admin.ts
//
// Safe to re-run — it upserts, so running it again just resets the password.

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'System Admin';

  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD env vars before running this script.');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    create: { name, email, passwordHash, role: 'ADMIN' },
    update: { passwordHash, role: 'ADMIN', name },
  });

  console.log(`Admin ready: ${user.email} (id: ${user.id})`);
  console.log('Log in via POST /auth/login to get a JWT, then use it to call /auth/register for everyone else.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
