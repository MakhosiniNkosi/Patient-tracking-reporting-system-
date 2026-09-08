import { Body, Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterUserDto, RegisterFirstAdminDto, AppointAdminDto } from './dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Public — no guard. Only ever succeeds once: it creates the first ADMIN
  // and rejects every call after that (see AuthService.registerFirstAdmin).
  // This is what the login screen's "Register" link hits.
  @Post('register-admin')
  registerFirstAdmin(@Body() dto: RegisterFirstAdminDto) {
    return this.authService.registerFirstAdmin(dto);
  }

  // ADMIN-only: creates CAPTURER/VERIFIER/PROGRAM_MANAGER accounts. Can't
  // create ADMIN or VIEWER — see AuthService.register for why.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('register')
  register(@Body() dto: RegisterUserDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Hands ADMIN to another existing user; the caller is demoted to VIEWER
  // in the same transaction. See AuthService.appointAdmin.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('appoint-admin')
  appointAdmin(@Body() dto: AppointAdminDto, @Request() req) {
    return this.authService.appointAdmin(req.user.id, dto.userId);
  }

  // ADMIN-only directory — what the appoint-admin picker lists from.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('users')
  listUsers() {
    return this.authService.listUsers();
  }
}
