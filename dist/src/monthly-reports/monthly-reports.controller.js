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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonthlyReportsController = void 0;
const common_1 = require("@nestjs/common");
const monthly_reports_service_1 = require("./monthly-reports.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
let MonthlyReportsController = class MonthlyReportsController {
    constructor(service) {
        this.service = service;
    }
    upsert(dto, req) {
        return this.service.upsert(dto, req.user.id);
    }
    async findByFacilityCycleMonth(facilityId, cycleId, month, req, res) {
        const report = await this.service.findByFacilityCycleMonth(facilityId, cycleId, month, req.user);
        res.json(report);
    }
    findAllForFacility(facilityId, cycleId, req) {
        return this.service.findAllForFacility(facilityId, cycleId, req.user);
    }
    findOne(id, req) {
        return this.service.findOneForUser(id, req.user);
    }
    async export(id, res, req) {
        const { csv, filename } = await this.service.exportCsv(id, req.user);
        res.set({
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
        });
        res.send(csv);
    }
    submit(id) {
        return this.service.submit(id);
    }
    verify(id, dto) {
        return this.service.verify(id, dto);
    }
    trend(facilityId, cycleId, indicatorId, req) {
        return this.service.indicatorTrend(facilityId, cycleId, indicatorId, req.user);
    }
};
exports.MonthlyReportsController = MonthlyReportsController;
__decorate([
    (0, roles_decorator_1.Roles)('CAPTURER', 'PROGRAM_MANAGER', 'ADMIN'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateMonthlyReportDto, Object]),
    __metadata("design:returntype", void 0)
], MonthlyReportsController.prototype, "upsert", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('facilityId')),
    __param(1, (0, common_1.Query)('cycleId')),
    __param(2, (0, common_1.Query)('month')),
    __param(3, (0, common_1.Request)()),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], MonthlyReportsController.prototype, "findByFacilityCycleMonth", null);
__decorate([
    (0, common_1.Get)('all'),
    __param(0, (0, common_1.Query)('facilityId')),
    __param(1, (0, common_1.Query)('cycleId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], MonthlyReportsController.prototype, "findAllForFacility", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MonthlyReportsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/export'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], MonthlyReportsController.prototype, "export", null);
__decorate([
    (0, roles_decorator_1.Roles)('CAPTURER', 'PROGRAM_MANAGER', 'ADMIN'),
    (0, common_1.Patch)(':id/submit'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MonthlyReportsController.prototype, "submit", null);
__decorate([
    (0, roles_decorator_1.Roles)('VERIFIER', 'ADMIN'),
    (0, common_1.Patch)(':id/verify'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.VerifyMonthlyReportDto]),
    __metadata("design:returntype", void 0)
], MonthlyReportsController.prototype, "verify", null);
__decorate([
    (0, common_1.Get)('trend/:facilityId/:cycleId/:indicatorId'),
    __param(0, (0, common_1.Param)('facilityId')),
    __param(1, (0, common_1.Param)('cycleId')),
    __param(2, (0, common_1.Param)('indicatorId')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], MonthlyReportsController.prototype, "trend", null);
exports.MonthlyReportsController = MonthlyReportsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('monthly-reports'),
    __metadata("design:paramtypes", [monthly_reports_service_1.MonthlyReportsService])
], MonthlyReportsController);
//# sourceMappingURL=monthly-reports.controller.js.map