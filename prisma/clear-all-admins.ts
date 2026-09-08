// Deletes every user currently holding role ADMIN. Use this to reset to a
// clean state where the next person to use the login screen's "Register"
// link becomes the admin — useful after testing has left multiple old
// admin accounts behind (list-admins.ts shows you what exists first).
//
// Usage:
//   npx tsx prisma/clear-all-admins.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, name: true, email: true },
  });

  if (admins.length === 0) {
    console.log('No ADMIN exists already — nothing to clear.');
    return;
  }

  for (const a of admins) {
    await prisma.user.delete({ where: { id: a.id } });
    console.log(`Deleted ${a.name} <${a.email}>`);
  }

  console.log(`\nCleared ${admins.length} admin account(s). No ADMIN exists now — the`);
  console.log('login screen\'s "Register" link is open for the next person.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
