"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../prisma.service");
let AuthService = class AuthService {
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
    }
    async registerFirstAdmin(dto) {
        const existingAdmin = await this.prisma.user.findFirst({ where: { role: 'ADMIN' } });
        if (existingAdmin) {
            throw new common_1.ConflictException('An admin account already exists. Ask your administrator to create your account.');
        }
        const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existingEmail)
            throw new common_1.ConflictException('Email already registered');
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: { name: dto.name, email: dto.email, passwordHash, role: 'ADMIN' },
        });
        return this.issueToken(user.id, user.role, user.facilityId);
    }
    async register(dto) {
        if (dto.role === 'ADMIN' || dto.role === 'VIEWER') {
            throw new common_1.BadRequestException('Use the appoint-admin action to change who the admin is, not this form.');
        }
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing)
            throw new common_1.ConflictException('Email already registered');
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                passwordHash,
                role: dto.role,
                facilityId: dto.facilityId,
            },
        });
        return this.issueToken(user.id, user.role, user.facilityId);
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const valid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!valid)
            throw new common_1.UnauthorizedException('Invalid credentials');
        return this.issueToken(user.id, user.role, user.facilityId);
    }
    async appointAdmin(currentAdminId, targetUserId) {
        if (currentAdminId === targetUserId) {
            throw new common_1.BadRequestException('You are already the admin.');
        }
        const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
        if (!target)
            throw new common_1.NotFoundException('User not found');
        if (target.role === 'ADMIN')
            throw new common_1.ConflictException('That user is already the admin.');
        await this.prisma.$transaction([
            this.prisma.user.update({ where: { id: targetUserId }, data: { role: 'ADMIN' } }),
            this.prisma.user.update({ where: { id: currentAdminId }, data: { role: 'VIEWER' } }),
        ]);
        return { message: `${target.name} is now the admin. Your account has moved to Viewer.` };
    }
    listUsers() {
        return this.prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, facilityId: true },
            orderBy: { name: 'asc' },
        });
    }
    issueToken(sub, role, facilityId) {
        const payload = { sub, role, facilityId };
        return {
            accessToken: this.jwt.sign(payload),
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map