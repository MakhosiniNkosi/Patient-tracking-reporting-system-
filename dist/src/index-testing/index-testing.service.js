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
exports.IndexTestingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const facility_access_util_1 = require("../auth/facility-access.util");
let IndexTestingService = class IndexTestingService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(dto, completedBy) {
        return this.prisma.indexTestingReferral.create({
            data: { ...dto, date: new Date(dto.date), completedBy },
        });
    }
    findByFacility(facilityId, from, to, user) {
        (0, facility_access_util_1.assertFacilityAccess)(user, facilityId);
        return this.prisma.indexTestingReferral.findMany({
            where: {
                facilityId,
                ...(from || to
                    ? {
                        date: {
                            ...(from ? { gte: new Date(from) } : {}),
                            ...(to ? { lte: new Date(to) } : {}),
                        },
                    }
                    : {}),
            },
            orderBy: { date: 'asc' },
        });
    }
};
exports.IndexTestingService = IndexTestingService;
exports.IndexTestingService = IndexTestingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IndexTestingService);
//# sourceMappingURL=index-testing.service.js.map