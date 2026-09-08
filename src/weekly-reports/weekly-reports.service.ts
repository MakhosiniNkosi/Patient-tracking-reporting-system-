import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateWeeklyReportDto } from './dto';
import { WeeklyReportStatus, ReportStatus, Prisma } from '@prisma/client';
import { buildCsv } from '../common/csv.util';
import { assertFacilityAccess, RequestUser } from '../auth/facility-access.util';

@Injectable()
export class WeeklyReportsService {
  constructor(private prisma: PrismaService) {}

  // Capture/update one week's grid, and automatically sync the change into
  // the monthly report's running totals in the same transaction. Every
  // indicator gets a row — blanks become an explicit 0, never skipped.
  //
  // The monthly sync is delta-based: it compares each indicator's new value
  // against what this week previously held (0 the first time) and applies
  // only the *difference* to the monthly entry. That's what makes editing a
  // week safe — re-saving with a corrected number adjusts the monthly total
  // by the change, rather than adding the new value on top of the old one.
  async upsert(dto: CreateWeeklyReportDto, capturedById: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.weeklyReport.findUnique({
        where: {
          facilityId_cycleId_month_weekLabel: {
            facilityId: dto.facilityId,
            cycleId: dto.cycleId,
            month: dto.month,
            weekLabel: dto.weekLabel,
          },
        },
        include: { entries: true },
      });

      const previousValueByIndicator = new Map(
        (existing?.entries ?? []).map((e) => [e.indicatorId, e.value]),
      );

      const report = await tx.weeklyReport.upsert({
        where: {
          facilityId_cycleId_month_weekLabel: {
            facilityId: dto.facilityId,
            cycleId: dto.cycleId,
            month: dto.month,
            weekLabel: dto.weekLabel,
          },
        },
        create: {
          facilityId: dto.facilityId,
          cycleId: dto.cycleId,
          month: dto.month,
          weekLabel: dto.weekLabel,
          capturedById,
          status: WeeklyReportStatus.DRAFT,
        },
        update: {}, // status untouched — editing a week doesn't need to reset its workflow state
      });

      const allIndicators = await tx.indicator.findMany({ select: { id: true } });
      const newValueByIndicator = new Map<string, Prisma.Decimal | number>(
        dto.entries.map((e) => [e.indicatorId, e.value ?? 0]),
      );

      await tx.weeklyReportEntry.deleteMany({ where: { reportId: report.id } });
      await tx.weeklyReportEntry.createMany({
        data: allIndicators.map((ind) => ({
          reportId: report.id,
          indicatorId: ind.id,
          value: newValueByIndicator.get(ind.id) ?? 0,
        })),
      });

      // Ensure the monthly report row exists before adjusting its entries.
      const monthly = await tx.monthlyReport.upsert({
        where: {
          facilityId_cycleId_month: {
            facilityId: dto.facilityId,
            cycleId: dto.cycleId,
            month: dto.month,
          },
        },
        create: {
          facilityId: dto.facilityId,
          cycleId: dto.cycleId,
          month: dto.month,
          status: ReportStatus.DRAFT,
        },
        update: {},
      });

      for (const ind of allIndicators) {
        const oldValue = Number(previousValueByIndicator.get(ind.id) ?? 0);
        const newValue = Number(newValueByIndicator.get(ind.id) ?? 0);
        const delta = newValue - oldValue;
        if (delta === 0) continue; // no change for this indicator, nothing to sync

        await tx.monthlyReportEntry.upsert({
          where: { reportId_indicatorId: { reportId: monthly.id, indicatorId: ind.id } },
          create: { reportId: monthly.id, indicatorId: ind.id, value: delta },
          update: { value: { increment: delta } },
        });
      }

      await tx.weeklyReport.update({
        where: { id: report.id },
        data: { lastSyncedAt: new Date() },
      });

      return tx.weeklyReport.findUniqueOrThrow({
        where: { id: report.id },
        include: { entries: { include: { indicator: true } } },
      });
    });
  }

  async findOne(id: string) {
    const report = await this.prisma.weeklyReport.findUnique({
      where: { id },
      include: { entries: { include: { indicator: true } }, facility: true, cycle: true },
    });
    if (!report) throw new NotFoundException('Weekly report not found');
    return report;
  }

  // See MonthlyReportsService.findOneForUser — same idea: findOne stays
  // unchecked for internal callers (submit/exportCsv), this variant adds
  // the facility-authorization check for the read-facing routes.
  async findOneForUser(id: string, user: RequestUser) {
    const report = await this.findOne(id);
    assertFacilityAccess(user, report.facilityId);
    return report;
  }

  findByMonth(facilityId: string, cycleId: string, month: string, user: RequestUser) {
    assertFacilityAccess(user, facilityId);
    return this.prisma.weeklyReport.findMany({
      where: { facilityId, cycleId, month },
      include: { entries: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Every week across every month, for the "all reports" browsing screen.
  // No entries — the list only needs month/week/status, full detail is
  // fetched when a specific week is opened.
  findAllForFacility(facilityId: string, cycleId: string, user: RequestUser) {
    assertFacilityAccess(user, facilityId);
    return this.prisma.weeklyReport.findMany({
      where: { facilityId, cycleId },
      select: { id: true, month: true, weekLabel: true, status: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async submit(id: string) {
    await this.findOne(id);
    return this.prisma.weeklyReport.update({
      where: { id },
      data: { status: WeeklyReportStatus.SUBMITTED },
    });
  }

  async exportCsv(id: string, user: RequestUser) {
    const report = await this.findOneForUser(id, user);
    const entries = [...report.entries].sort(
      (a, b) => a.indicator.sortOrder - b.indicator.sortOrder,
    );

    const rows: (string | number)[][] = [
      ['Facility', report.facility.name],
      ['Week', report.weekLabel],
      ['Month', report.month],
      ['Performance cycle', report.cycle.label],
      ['Status', report.status],
      [],
      ['Indicator', 'Value'],
      ...entries.map((e) => [e.indicator.label, Number(e.value)]),
    ];

    return {
      csv: buildCsv(rows),
      filename: `weekly-report-${report.facility.facilityCode}-${report.month}-${report.weekLabel.replace(/[^a-z0-9]+/gi, '-')}.csv`,
    };
  }
}
