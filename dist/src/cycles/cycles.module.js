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
exports.CyclesModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
let CyclesService = class CyclesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll() {
        return this.prisma.performanceCycle.findMany({ orderBy: { startDate: 'desc' } });
    }
    async createNext() {
        const latest = await this.prisma.performanceCycle.findFirst({
            orderBy: { startDate: 'desc' },
        });
        const startYear = latest ? new Date(latest.startDate).getUTCFullYear() + 1 : new Date().getUTCFullYear();
        const label = `${startYear}/${startYear + 1}`;
        const existing = await this.prisma.performanceCycle.findUnique({ where: { label } });
        if (existing) {
            throw new common_1.ConflictException(`Cycle ${label} already exists.`);
        }
        return this.prisma.performanceCycle.create({
            data: {
                label,
                startDate: new Date(Date.UTC(startYear, 9, 1)),
                endDate: new Date(Date.UTC(startYear + 1, 8, 30)),
            },
        });
    }
};
CyclesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CyclesService);
let CyclesController = class CyclesController {
    constructor(service) {
        this.service = service;
    }
    findAll() {
        return this.service.findAll();
    }
    createNext() {
        return this.service.createNext();
    }
};
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CyclesController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.Post)('next'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CyclesController.prototype, "createNext", null);
CyclesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('performance-cycles'),
    __metadata("design:paramtypes", [CyclesService])
], CyclesController);
let CyclesModule = class CyclesModule {
};
exports.CyclesModule = CyclesModule;
exports.CyclesModule = CyclesModule = __decorate([
    (0, common_1.Module)({
        controllers: [CyclesController],
        providers: [CyclesService, prisma_service_1.PrismaService],
    })
], CyclesModule);
//# sourceMappingURL=cycles.module.js.map