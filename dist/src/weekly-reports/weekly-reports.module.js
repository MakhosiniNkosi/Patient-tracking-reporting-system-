"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeeklyReportsModule = void 0;
const common_1 = require("@nestjs/common");
const weekly_reports_controller_1 = require("./weekly-reports.controller");
const weekly_reports_service_1 = require("./weekly-reports.service");
const prisma_service_1 = require("../prisma.service");
let WeeklyReportsModule = class WeeklyReportsModule {
};
exports.WeeklyReportsModule = WeeklyReportsModule;
exports.WeeklyReportsModule = WeeklyReportsModule = __decorate([
    (0, common_1.Module)({
        controllers: [weekly_reports_controller_1.WeeklyReportsController],
        providers: [weekly_reports_service_1.WeeklyReportsService, prisma_service_1.PrismaService],
        exports: [weekly_reports_service_1.WeeklyReportsService],
    })
], WeeklyReportsModule);
//# sourceMappingURL=weekly-reports.module.js.map