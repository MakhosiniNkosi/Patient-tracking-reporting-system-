import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class RegisterUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  role: string; // 'CAPTURER' | 'VERIFIER' | 'PROGRAM_MANAGER' — never 'ADMIN'
                // or 'VIEWER' here; see AuthService.register for why.

  // Genuinely optional — "Not facility-scoped" accounts (e.g. most ADMINs)
  // omit this entirely. Without @IsOptional(), class-validator treats a
  // missing property as an invalid one for any other decorated field,
  // which is what was causing every "Not facility-scoped" registration to
  // 400 regardless of role.
  @IsOptional()
  @IsString()
  facilityId?: string;
}

// Public, unauthenticated self-registration — deliberately narrow: no role
// or facility fields, because this always creates an ADMIN and only
// succeeds once (see AuthService.registerFirstAdmin). Every account after
// the first must come from an existing ADMIN via RegisterUserDto or the
// appoint-admin handoff.
export class RegisterFirstAdminDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

// Hands ADMIN to another existing user; the caller (the current ADMIN) is
// demoted to VIEWER in the same transaction. See AuthService.appointAdmin.
export class AppointAdminDto {
  @IsString()
  userId: string;
}
