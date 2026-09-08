"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const SEEDED_ADMIN_EMAIL = 'admin@testclinic.co.za';
async function main() {
    const existing = await prisma.user.findUnique({ where: { email: SEEDED_ADMIN_EMAIL } });
    if (!existing) {
        console.log(`No user found with email ${SEEDED_ADMIN_EMAIL} — nothing to do.`);
        return;
    }
    if (existing.role !== 'ADMIN') {
        console.log(`${SEEDED_ADMIN_EMAIL} exists but is role ${existing.role}, not ADMIN — leaving it alone. ` +
            `Delete manually via Prisma Studio if you're sure you want it gone.`);
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
//# sourceMappingURL=remove-seeded-admin.js.map