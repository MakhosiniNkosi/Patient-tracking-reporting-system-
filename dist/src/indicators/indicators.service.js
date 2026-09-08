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
exports.IndicatorsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let IndicatorsService = class IndicatorsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll() {
        return this.prisma.indicator.findMany({ orderBy: { sortOrder: 'asc' } });
    }
    async findOne(id) {
        const indicator = await this.prisma.indicator.findUnique({ where: { id } });
        if (!indicator)
            throw new common_1.NotFoundException('Indicator not found');
        return indicator;
    }
    async findAllWithTargets(cycleId) {
        const indicators = await this.prisma.indicator.findMany({ orderBy: { sortOrder: 'asc' } });
        const targets = await this.prisma.indicatorTarget.findMany({ where: { cycleId } });
        const targetByIndicator = new Map(targets.map((t) => [t.indicatorId, t.targetValue]));
        return indicators.map((ind) => ({ ...ind, target: targetByIndicator.get(ind.id) ?? null }));
    }
};
exports.IndicatorsService = IndicatorsService;
exports.IndicatorsService = IndicatorsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IndicatorsService);
//# sourceMappingURL=indicators.service.js.map