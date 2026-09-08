"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const INDICATORS = [
    { code: 'PREP_STARTED', label: '# of clients started on PrEP', unitType: client_1.UnitType.RATE_PER_DAY, target: '1 per day', sortOrder: 1 },
    { code: 'ART_NEWLY_DX_STARTED', label: '# of newly diagnosed started on ART', unitType: client_1.UnitType.COUNT, target: '-', sortOrder: 2 },
    { code: 'CD4_TEST_DONE', label: '# of newly diagnosed with a CD4 test done', unitType: client_1.UnitType.PERCENT, target: '100%', sortOrder: 3 },
    { code: 'TPT_STARTED_NEW', label: '# of newly diagnosed clients started on TPT', unitType: client_1.UnitType.PERCENT, target: '100% eligible', sortOrder: 4 },
    { code: 'CACX_SCREENED', label: '# of newly diagnosed screened for CACx', unitType: client_1.UnitType.PERCENT, target: '100% eligible', sortOrder: 5 },
    { code: 'RPR_TEST_DONE', label: '# of newly diagnosed with RPR test done', unitType: client_1.UnitType.PERCENT, target: '100% eligible', sortOrder: 6 },
    { code: 'ART_FOLLOWUP_SEEN', label: 'Total ART follow up seen', unitType: client_1.UnitType.COUNT, target: '-', sortOrder: 7 },
    { code: 'LAM_NAAT_DONE', label: '# of LAM NAAT test done', unitType: client_1.UnitType.COUNT, target: '-', sortOrder: 8 },
    { code: 'TPT_EXPERIENCED_3HP', label: '# of experienced clients initiated on TPT 3HP', unitType: client_1.UnitType.COUNT, target: '-', sortOrder: 9 },
    { code: 'TPT_EXPERIENCED_12H_6H', label: '# of experienced clients initiated on TPT 12H/6H', unitType: client_1.UnitType.COUNT, target: '-', sortOrder: 10 },
    { code: 'VL_50_999_AUDITED', label: '# of VL 50-999 c/ml files audited', unitType: client_1.UnitType.RATE_PER_WEEK, target: '10 per week', sortOrder: 11 },
    { code: 'VL_50_999_REFERRED_INDEX', label: '# of clients with VL 50-999 referred for index', unitType: client_1.UnitType.RATE_PER_WEEK, target: '5 per week', sortOrder: 12 },
    { code: 'OTHER_REFERRED_INDEX', label: '# of clients other than VL 50-999 referred for index', unitType: client_1.UnitType.RATE_PER_WEEK, target: '5 per week', sortOrder: 13 },
    { code: 'DORMANT_DMOC_AUDITED', label: '# of Dormant DMOC files audited', unitType: client_1.UnitType.RATE_PER_WEEK, target: '5 per week', sortOrder: 14 },
    { code: 'CLIENTS_DECANTED', label: '# of clients decanted (New and rescript)', unitType: client_1.UnitType.COUNT, target: '-', sortOrder: 15 },
    { code: 'TB_PATIENTS_SEEN', label: '# of TB patients seen', unitType: client_1.UnitType.COUNT, target: '-', sortOrder: 16 },
];
async function main() {
    const cycle = await prisma.performanceCycle.upsert({
        where: { label: '2025/2026' },
        create: {
            label: '2025/2026',
            startDate: new Date('2025-10-01'),
            endDate: new Date('2026-09-30'),
        },
        update: {},
    });
    await prisma.performanceCycle.upsert({
        where: { label: '2026/2027' },
        create: { label: '2026/2027', startDate: new Date('2026-10-01'), endDate: new Date('2027-09-30') },
        update: {},
    });
    await prisma.performanceCycle.upsert({
        where: { label: '2027/2028' },
        create: { label: '2027/2028', startDate: new Date('2027-10-01'), endDate: new Date('2028-09-30') },
        update: {},
    });
    for (const ind of INDICATORS) {
        const indicator = await prisma.indicator.upsert({
            where: { code: ind.code },
            create: {
                code: ind.code,
                label: ind.label,
                unitType: ind.unitType,
                sortOrder: ind.sortOrder,
            },
            update: { label: ind.label, unitType: ind.unitType, sortOrder: ind.sortOrder },
        });
        await prisma.indicatorTarget.upsert({
            where: { indicatorId_cycleId: { indicatorId: indicator.id, cycleId: cycle.id } },
            create: { indicatorId: indicator.id, cycleId: cycle.id, targetValue: ind.target },
            update: { targetValue: ind.target },
        });
    }
    await prisma.facility.upsert({
        where: { facilityCode: 'HEIDELBERG_PHC' },
        create: { name: 'Heidelberg PHC', facilityCode: 'HEIDELBERG_PHC', district: 'Sedibeng' },
        update: {},
    });
    await prisma.facility.upsert({
        where: { facilityCode: 'EXT23_PHC' },
        create: { name: 'Ext 23 PHC', facilityCode: 'EXT23_PHC', district: 'Sedibeng' },
        update: {},
    });
    console.log(`Seeded ${INDICATORS.length} indicators, 1 cycle, 2 facilities.`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map