"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const monthly_reports_module_1 = require("./monthly-reports/monthly-reports.module");
const weekly_reports_module_1 = require("./weekly-reports/weekly-reports.module");
const auth_module_1 = require("./auth/auth.module");
const facilities_module_1 = require("./facilities/facilities.module");
const indicators_module_1 = require("./indicators/indicators.module");
const index_testing_module_1 = require("./index-testing/index-testing.module");
const cycles_module_1 = require("./cycles/cycles.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            monthly_reports_module_1.MonthlyReportsModule,
            weekly_reports_module_1.WeeklyReportsModule,
            auth_module_1.AuthModule,
            facilities_module_1.FacilitiesModule,
            indicators_module_1.IndicatorsModule,
            index_testing_module_1.IndexTestingModule,
            cycles_module_1.CyclesModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map