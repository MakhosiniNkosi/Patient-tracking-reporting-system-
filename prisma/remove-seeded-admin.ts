// Removes the built-in admin@testclinic.co.za account that older versions
// of seed.ts used to create automatically. Needed because that seed
// change only affects fresh installs going forward — it doesn't touch
// data that already exists in your database. Run this once to clear the
// way for the public "Register" link (POST /auth/register-admin) to work:
// that route refuses to run as long as ANY user has role ADMIN.
//
// Usage:
//   npx tsx prisma/remove-seeded-admin.ts
//
// Safe to run even if the account doesn't exist (no-op) or if you've
// since changed its password/details — it matches on email only.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SEEDED_ADMIN_EMAIL = 'admin@testclinic.co.za';

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: SEEDED_ADMIN_EMAIL } });
  if (!existing) {
    console.log(`No user found with email ${SEEDED_ADMIN_EMAIL} — nothing to do.`);
    return;
  }
  if (existing.role !== 'ADMIN') {
    console.log(
      `${SEEDED_ADMIN_EMAIL} exists but is role ${existing.role}, not ADMIN — leaving it alone. ` +
        `Delete manually via Prisma Studio if you're sure you want it gone.`,
    );
    return;
  }

  await prisma.user.delete({ where: { id: existing.id } });
  console.log(`Removed ${SEEDED_ADMIN_EMAIL}. No ADMIN exists now — the next person to use the`);
  console.log(`login screen's "Register" link will become the admin.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
