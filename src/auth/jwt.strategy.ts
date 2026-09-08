import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'change-me-in-.env',
    });
  }

  // Return value here becomes req.user. Matches what RolesGuard and
  // MonthlyReportsController (req.user.id / req.user.role) expect.
  async validate(payload: { sub: string; role: string; facilityId: string | null }) {
    return { id: payload.sub, role: payload.role, facilityId: payload.facilityId };
  }
}
