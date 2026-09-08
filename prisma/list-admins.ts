// Lists every user currently holding role ADMIN, regardless of email.
// Useful when remove-seeded-admin.ts (which only targets one known email)
// isn't enough — e.g. if an admin was created or appointed under a
// different address than the original seeded one.
//
// Usage:
//   npx tsx prisma/list-admins.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, name: true, email: true },
  });

  if (admins.length === 0) {
    console.log('No ADMIN exists — the public "Register" link is open.');
    return;
  }

  console.log(`${admins.length} account(s) currently hold ADMIN:`);
  for (const a of admins) {
    console.log(`  - ${a.name} <${a.email}> (id: ${a.id})`);
  }
  console.log('\nTo clear one: npx prisma studio, find it in the users table, and delete or');
  console.log('demote it (e.g. change role to VIEWER) directly.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
