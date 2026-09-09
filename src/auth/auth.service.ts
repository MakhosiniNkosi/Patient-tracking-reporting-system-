import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma.service';
import { EmailService } from './email.service';
import {
  LoginDto,
  RegisterUserDto,
  RegisterFirstAdminDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private email: EmailService,
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

  // Self-service — requires the current password, unlike resetPassword.
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { message: 'Password changed.' };
  }

  // Public. Always returns the same generic message whether or not the
  // email is registered — the alternative (revealing "no account with
  // that email") turns this endpoint into an account-existence oracle.
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (user) {
      // The raw token goes in the email link; only its hash is stored, so
      // a database leak alone can't be used to reset anyone's password —
      // same principle as bcrypt for the passwords themselves.
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await this.prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
      const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;
      await this.email.sendPasswordResetEmail(user.email, resetUrl);
    }
    return { message: 'If that email is registered, a reset link has been sent.' };
  }

  // Public — the counterpart to forgotPassword. Rejects an expired,
  // already-used, or unrecognized token with the same generic message,
  // so this can't be used to probe for which tokens are real either.
  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('This reset link is invalid or has expired.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      this.prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);

    return { message: 'Password reset. You can now log in with your new password.' };
  }

  private issueToken(sub: string, role: string, facilityId: string | null) {
    const payload = { sub, role, facilityId };
    return {
      accessToken: this.jwt.sign(payload),
    };
  }
}
