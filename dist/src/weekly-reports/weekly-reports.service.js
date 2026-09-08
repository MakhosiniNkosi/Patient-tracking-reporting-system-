"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeeklyReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const client_1 = require("@prisma/client");
const csv_util_1 = require("../common/csv.util");
const facility_access_util_1 = require("../auth/facility-access.util");
let WeeklyReportsService = class WeeklyReportsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async upsert(dto, capturedById) {
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
            const previousValueByIndicator = new Map((existing?.entries ?? []).map((e) => [e.indicatorId, e.value]));
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
                    status: client_1.WeeklyReportStatus.DRAFT,
                },
                update: {},
            });
            const allIndicators = await tx.indicator.findMany({ select: { id: true } });
            const newValueByIndicator = new Map(dto.entries.map((e) => [e.indicatorId, e.value ?? 0]));
            await tx.weeklyReportEntry.deleteMany({ where: { reportId: report.id } });
            await tx.weeklyReportEntry.createMany({
                data: allIndicators.map((ind) => ({
                    reportId: report.id,
                    indicatorId: ind.id,
                    value: newValueByIndicator.get(ind.id) ?? 0,
                })),
            });
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
                    status: client_1.ReportStatus.DRAFT,
                },
                update: {},
            });
            for (const ind of allIndicators) {
                const oldValue = Number(previousValueByIndicator.get(ind.id) ?? 0);
                const newValue = Number(newValueByIndicator.get(ind.id) ?? 0);
                const delta = newValue - oldValue;
                if (delta === 0)
                    continue;
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
    async findOne(id) {
        const report = await this.prisma.weeklyReport.findUnique({
            where: { id },
            include: { entries: { include: { indicator: true } }, facility: true, cycle: true },
        });
        if (!report)
            throw new common_1.NotFoundException('Weekly report not found');
        return report;
    }
    async findOneForUser(id, user) {
        const report = await this.findOne(id);
        (0, facility_access_util_1.assertFacilityAccess)(user, report.facilityId);
        return report;
    }
    findByMonth(facilityId, cycleId, month, user) {
        (0, facility_access_util_1.assertFacilityAccess)(user, facilityId);
        return this.prisma.weeklyReport.findMany({
            where: { facilityId, cycleId, month },
            include: { entries: true },
            orderBy: { createdAt: 'asc' },
        });
    }
    findAllForFacility(facilityId, cycleId, user) {
        (0, facility_access_util_1.assertFacilityAccess)(user, facilityId);
        return this.prisma.weeklyReport.findMany({
            where: { facilityId, cycleId },
            select: { id: true, month: true, weekLabel: true, status: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async submit(id) {
        await this.findOne(id);
        return this.prisma.weeklyReport.update({
            where: { id },
            data: { status: client_1.WeeklyReportStatus.SUBMITTED },
        });
    }
    async exportCsv(id, user) {
        const report = await this.findOneForUser(id, user);
        const entries = [...report.entries].sort((a, b) => a.indicator.sortOrder - b.indicator.sortOrder);
        const rows = [
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
            csv: (0, csv_util_1.buildCsv)(rows),
            filename: `weekly-report-${report.facility.facilityCode}-${report.month}-${report.weekLabel.replace(/[^a-z0-9]+/gi, '-')}.csv`,
        };
    }
};
exports.WeeklyReportsService = WeeklyReportsService;
exports.WeeklyReportsService = WeeklyReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WeeklyReportsService);
//# sourceMappingURL=weekly-reports.service.js.map