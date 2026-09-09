import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateMonthlyReportDto, VerifyMonthlyReportDto } from './dto';
import { ReportStatus } from '@prisma/client';
import { buildCsv } from '../common/csv.util';
import { assertFacilityAccess, RequestUser } from '../auth/facility-access.util';

@Injectable()
export class MonthlyReportsService {
  constructor(private prisma: PrismaService) {}

  // Capture or update a facility's monthly indicator grid.
  // Mirrors one row of the paper form: facility + cycle + month + N indicator values.
  async upsert(dto: CreateMonthlyReportDto, capturedById: string) {
    const report = await this.prisma.monthlyReport.upsert({
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
        capturedById,
        status: ReportStatus.DRAFT,
      },
      update: {
        status: ReportStatus.DRAFT, // editing resets to draft until re-verified
      },
    });

    // Replace entries for this report (idempotent capture)
    await this.prisma.monthlyReportEntry.deleteMany({ where: { reportId: report.id } });
    await this.prisma.monthlyReportEntry.createMany({
      data: dto.entries.map((e) => ({
        reportId: report.id,
        indicatorId: e.indicatorId,
        value: e.value,
      })),
    });

    return this.findOne(report.id);
  }

  async findOne(id: string) {
    const report = await this.prisma.monthlyReport.findUnique({
      where: { id },
      include: { entries: { include: { indicator: true } }, facility: true, cycle: true },
    });
    if (!report) throw new NotFoundException('Monthly report not found');
    return report;
  }

  // Authorization-checked variant for the read-facing routes: fetches the
  // report, then confirms the requesting user is allowed to view whichever
  // facility it belongs to. `findOne` itself stays unchecked since it's
  // also used internally by submit/verify/exportCsv, where the facility
  // check either doesn't apply or is done separately.
  async findOneForUser(id: string, user: RequestUser) {
    const report = await this.findOne(id);
    assertFacilityAccess(user, report.facilityId);
    return report;
  }

  // Looked up by facility/cycle/month rather than id, since the client
  // doesn't know the report's id until one has been created — this is what
  // the capture screen calls on load (and on month change) to show
  // whatever's already been saved, including totals synced in from weekly
  // reports. Returns null rather than 404ing when nothing's been saved yet
  // for this month — that's a normal, expected state, not an error.
  async findByFacilityCycleMonth(facilityId: string, cycleId: string, month: string, user: RequestUser) {
    assertFacilityAccess(user, facilityId);
    return this.prisma.monthlyReport.findUnique({
      where: { facilityId_cycleId_month: { facilityId, cycleId, month } },
      include: { entries: { include: { indicator: true } } },
    });
  }

  // Every month that has at least one saved report, for the "all reports"
  // browsing screen. Doesn't include entries — the list only needs
  // month/status, full detail is fetched when a specific month is opened.
  // Archived reports are excluded unless explicitly asked for — they still
  // exist, they're just hidden from the normal working view.
  findAllForFacility(facilityId: string, cycleId: string, user: RequestUser, includeArchived = false) {
    assertFacilityAccess(user, facilityId);
    return this.prisma.monthlyReport.findMany({
      where: { facilityId, cycleId, ...(includeArchived ? {} : { archivedAt: null }) },
      select: { id: true, month: true, status: true, updatedAt: true, archivedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async submit(id: string) {
    const report = await this.findOne(id);
    if (report.status !== ReportStatus.DRAFT) {
      throw new ConflictException('Only draft reports can be submitted');
    }
    return this.prisma.monthlyReport.update({
      where: { id },
      data: { status: ReportStatus.SUBMITTED },
    });
  }

  async verify(id: string, dto: VerifyMonthlyReportDto) {
    const report = await this.findOne(id);
    if (report.status !== ReportStatus.SUBMITTED) {
      throw new ConflictException('Only submitted reports can be verified');
    }
    return this.prisma.monthlyReport.update({
      where: { id },
      data: {
        status: ReportStatus.VERIFIED,
        verifiedBy: dto.verifiedBy,
        verifiedDate: new Date(),
      },
    });
  }

  // ADMIN-only (enforced at the controller). Soft-hide: the report and its
  // entries are untouched, it's just excluded from findAllForFacility's
  // default view. Reversible via unarchive — unlike remove, below.
  async archive(id: string) {
    await this.findOne(id); // 404s if it doesn't exist
    return this.prisma.monthlyReport.update({ where: { id }, data: { archivedAt: new Date() } });
  }

  async unarchive(id: string) {
    await this.findOne(id);
    return this.prisma.monthlyReport.update({ where: { id }, data: { archivedAt: null } });
  }

  // ADMIN-only (enforced at the controller). Permanent — entries cascade
  // via the FK's onDelete: Cascade. Deliberately does NOT touch any
  // WeeklyReports that fed into this month: they have no hard FK to this
  // record (only a matching facilityId/cycleId/month), so they're
  // unaffected either way. Worth knowing, though: because the monthly
  // sync is delta-based (see WeeklyReportsService.upsert), if someone
  // later edits one of those weeks again, the freshly-recreated monthly
  // report will only reflect that edit's delta, not the full history this
  // deleted report used to hold — there's no way to reconstruct the old
  // rolled-up total from the weeks alone once it's gone.
  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.monthlyReport.delete({ where: { id } });
    return { message: 'Monthly report deleted.' };
  }

  // Trend of one indicator across all months in a cycle, for dashboards
  async indicatorTrend(facilityId: string, cycleId: string, indicatorId: string, user: RequestUser) {
    assertFacilityAccess(user, facilityId);
    return this.prisma.monthlyReportEntry.findMany({
      where: {
        indicatorId,
        report: { facilityId, cycleId },
      },
      include: { report: { select: { month: true } } },
      orderBy: { report: { createdAt: 'asc' } },
    });
  }

  // CSV for download — a small metadata header block (facility, month,
  // cycle, status) followed by one row per indicator, sorted the same way
  // the paper form's columns are ordered.
  async exportCsv(id: string, user: RequestUser) {
    const report = await this.findOneForUser(id, user);
    const entries = [...report.entries].sort(
      (a, b) => a.indicator.sortOrder - b.indicator.sortOrder,
    );

    const rows: (string | number)[][] = [
      ['Facility', report.facility.name],
      ['Month', report.month],
      ['Performance cycle', report.cycle.label],
      ['Status', report.status],
      [],
      ['Indicator', 'Value'],
      ...entries.map((e) => [e.indicator.label, Number(e.value)]),
    ];

    return {
      csv: buildCsv(rows),
      filename: `monthly-report-${report.facility.facilityCode}-${report.month}.csv`,
    };
  }
}
