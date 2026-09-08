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
exports.MonthlyReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const client_1 = require("@prisma/client");
const csv_util_1 = require("../common/csv.util");
const facility_access_util_1 = require("../auth/facility-access.util");
let MonthlyReportsService = class MonthlyReportsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async upsert(dto, capturedById) {
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
                status: client_1.ReportStatus.DRAFT,
            },
            update: {
                status: client_1.ReportStatus.DRAFT,
            },
        });
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
    async findOne(id) {
        const report = await this.prisma.monthlyReport.findUnique({
            where: { id },
            include: { entries: { include: { indicator: true } }, facility: true, cycle: true },
        });
        if (!report)
            throw new common_1.NotFoundException('Monthly report not found');
        return report;
    }
    async findOneForUser(id, user) {
        const report = await this.findOne(id);
        (0, facility_access_util_1.assertFacilityAccess)(user, report.facilityId);
        return report;
    }
    async findByFacilityCycleMonth(facilityId, cycleId, month, user) {
        (0, facility_access_util_1.assertFacilityAccess)(user, facilityId);
        return this.prisma.monthlyReport.findUnique({
            where: { facilityId_cycleId_month: { facilityId, cycleId, month } },
            include: { entries: { include: { indicator: true } } },
        });
    }
    findAllForFacility(facilityId, cycleId, user) {
        (0, facility_access_util_1.assertFacilityAccess)(user, facilityId);
        return this.prisma.monthlyReport.findMany({
            where: { facilityId, cycleId },
            select: { id: true, month: true, status: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async submit(id) {
        const report = await this.findOne(id);
        if (report.status !== client_1.ReportStatus.DRAFT) {
            throw new common_1.ConflictException('Only draft reports can be submitted');
        }
        return this.prisma.monthlyReport.update({
            where: { id },
            data: { status: client_1.ReportStatus.SUBMITTED },
        });
    }
    async verify(id, dto) {
        const report = await this.findOne(id);
        if (report.status !== client_1.ReportStatus.SUBMITTED) {
            throw new common_1.ConflictException('Only submitted reports can be verified');
        }
        return this.prisma.monthlyReport.update({
            where: { id },
            data: {
                status: client_1.ReportStatus.VERIFIED,
                verifiedBy: dto.verifiedBy,
                verifiedDate: new Date(),
            },
        });
    }
    async indicatorTrend(facilityId, cycleId, indicatorId, user) {
        (0, facility_access_util_1.assertFacilityAccess)(user, facilityId);
        return this.prisma.monthlyReportEntry.findMany({
            where: {
                indicatorId,
                report: { facilityId, cycleId },
            },
            include: { report: { select: { month: true } } },
            orderBy: { report: { createdAt: 'asc' } },
        });
    }
    async exportCsv(id, user) {
        const report = await this.findOneForUser(id, user);
        const entries = [...report.entries].sort((a, b) => a.indicator.sortOrder - b.indicator.sortOrder);
        const rows = [
            ['Facility', report.facility.name],
            ['Month', report.month],
            ['Performance cycle', report.cycle.label],
            ['Status', report.status],
            [],
            ['Indicator', 'Value'],
            ...entries.map((e) => [e.indicator.label, Number(e.value)]),
        ];
        return {
            csv: (0, csv_util_1.buildCsv)(rows),
            filename: `monthly-report-${report.facility.facilityCode}-${report.month}.csv`,
        };
    }
};
exports.MonthlyReportsService = MonthlyReportsService;
exports.MonthlyReportsService = MonthlyReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MonthlyReportsService);
//# sourceMappingURL=monthly-reports.service.js.map