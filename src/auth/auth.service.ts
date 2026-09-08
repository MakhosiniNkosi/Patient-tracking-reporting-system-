import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';
import { LoginDto, RegisterUserDto, RegisterFirstAdminDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  // Public self-registration — but only ever creates the FIRST admin.
  // Once any ADMIN exists, this always rejects: every account after that
  // has to come from an existing ADMIN (RegisterUserDto, below) or from
  // the appoint-admin handoff. This is what makes "first person in owns
  // the system" safe rather than "anyone can grab admin at any time."
  async registerFirstAdmin(dto: RegisterFirstAdminDto) {
    const existingAdmin = await this.prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (existingAdmin) {
      throw new ConflictException(
        'An admin account already exists. Ask your administrator to create your account.',
      );
    }
    const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingEmail) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, passwordHash, role: 'ADMIN' },
    });
    return this.issueToken(user.id, user.role, user.facilityId);
  }

  // ADMIN-only (enforced by @Roles on the controller route). Deliberately
  // refuses to create ADMIN or VIEWER accounts here — ADMIN can only pass
  // between two existing people via appointAdmin, and VIEWER only ever
  // results from being demoted by that handoff, never chosen directly.
  async register(dto: RegisterUserDto) {
    if (dto.role === 'ADMIN' || dto.role === 'VIEWER') {
      throw new BadRequestException(
        'Use the appoint-admin action to change who the admin is, not this form.',
      );
    }

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: dto.role as any,
        facilityId: dto.facilityId,
      },
    });
    return this.issueToken(user.id, user.role, user.facilityId);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.issueToken(user.id, user.role, user.facilityId);
  }

  // Hands ADMIN to targetUserId; the caller (the current admin) is demoted
  // to VIEWER in the same transaction, so there's never a moment with two
  // admins from this operation alone. Note this doesn't revoke the old
  // admin's already-issued JWT — it's stateless and keeps working with the
  // old role until it naturally expires (8h). A production system wanting
  // instant revocation would need a token blacklist or short-lived tokens
  // with refresh; out of scope here, but worth knowing.
  async appointAdmin(currentAdminId: string, targetUserId: string) {
    if (currentAdminId === targetUserId) {
      throw new BadRequestException('You are already the admin.');
    }
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException('User not found');
    if (target.role === 'ADMIN') throw new ConflictException('That user is already the admin.');

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: targetUserId }, data: { role: 'ADMIN' } }),
      this.prisma.user.update({ where: { id: currentAdminId }, data: { role: 'VIEWER' } }),
    ]);

    return { message: `${target.name} is now the admin. Your account has moved to Viewer.` };
  }

  // ADMIN-only user directory — what the appoint-admin picker lists from.
  listUsers() {
    return this.prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, facilityId: true },
      orderBy: { name: 'asc' },
    });
  }

  private issueToken(sub: string, role: string, facilityId: string | null) {
    const payload = { sub, role, facilityId };
    return {
      accessToken: this.jwt.sign(payload),
    };
  }
}
