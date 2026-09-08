import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Validates the JWT and attaches { id, role, facilityId } to req.user.
// Wire up a JwtStrategy (passport-jwt) in AuthModule to populate this.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
