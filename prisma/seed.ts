import { PrismaClient, UnitType } from '@prisma/client';

const prisma = new PrismaClient();

const INDICATORS: { code: string; label: string; unitType: UnitType; target: string; sortOrder: number }[] = [
  { code: 'PREP_STARTED', label: '# of clients started on PrEP', unitType: UnitType.RATE_PER_DAY, target: '1 per day', sortOrder: 1 },
  { code: 'ART_NEWLY_DX_STARTED', label: '# of newly diagnosed started on ART', unitType: UnitType.COUNT, target: '-', sortOrder: 2 },
  { code: 'CD4_TEST_DONE', label: '# of newly diagnosed with a CD4 test done', unitType: UnitType.PERCENT, target: '100%', sortOrder: 3 },
  { code: 'TPT_STARTED_NEW', label: '# of newly diagnosed clients started on TPT', unitType: UnitType.PERCENT, target: '100% eligible', sortOrder: 4 },
  { code: 'CACX_SCREENED', label: '# of newly diagnosed screened for CACx', unitType: UnitType.PERCENT, target: '100% eligible', sortOrder: 5 },
  { code: 'RPR_TEST_DONE', label: '# of newly diagnosed with RPR test done', unitType: UnitType.PERCENT, target: '100% eligible', sortOrder: 6 },
  { code: 'ART_FOLLOWUP_SEEN', label: 'Total ART follow up seen', unitType: UnitType.COUNT, target: '-', sortOrder: 7 },
  { code: 'LAM_NAAT_DONE', label: '# of LAM NAAT test done', unitType: UnitType.COUNT, target: '-', sortOrder: 8 },
  { code: 'TPT_EXPERIENCED_3HP', label: '# of experienced clients initiated on TPT 3HP', unitType: UnitType.COUNT, target: '-', sortOrder: 9 },
  { code: 'TPT_EXPERIENCED_12H_6H', label: '# of experienced clients initiated on TPT 12H/6H', unitType: UnitType.COUNT, target: '-', sortOrder: 10 },
  { code: 'VL_50_999_AUDITED', label: '# of VL 50-999 c/ml files audited', unitType: UnitType.RATE_PER_WEEK, target: '10 per week', sortOrder: 11 },
  { code: 'VL_50_999_REFERRED_INDEX', label: '# of clients with VL 50-999 referred for index', unitType: UnitType.RATE_PER_WEEK, target: '5 per week', sortOrder: 12 },
  { code: 'OTHER_REFERRED_INDEX', label: '# of clients other than VL 50-999 referred for index', unitType: UnitType.RATE_PER_WEEK, target: '5 per week', sortOrder: 13 },
  { code: 'DORMANT_DMOC_AUDITED', label: '# of Dormant DMOC files audited', unitType: UnitType.RATE_PER_WEEK, target: '5 per week', sortOrder: 14 },
  { code: 'CLIENTS_DECANTED', label: '# of clients decanted (New and rescript)', unitType: UnitType.COUNT, target: '-', sortOrder: 15 },
  { code: 'TB_PATIENTS_SEEN', label: '# of TB patients seen', unitType: UnitType.COUNT, target: '-', sortOrder: 16 },
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

  // Also seed the next couple of cycles so the picker isn't limited to a
  // single year on a fresh install — indicators/targets only get attached
  // to the current one below; use POST /performance-cycles/next (ADMIN) to
  // roll forward from here as each new performance year actually starts.
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

  // No built-in admin here on purpose — the first person to use the login
  // screen's "Register" link (POST /auth/register-admin) becomes the
  // admin. If you need a specific known admin account instead (e.g. for
  // a scripted setup), use prisma/seed-admin.ts.
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
