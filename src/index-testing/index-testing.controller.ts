import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { IndexTestingService } from './index-testing.service';
import { CreateIndexTestingReferralDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('index-testing-referrals')
export class IndexTestingController {
  constructor(private readonly service: IndexTestingService) {}

  @Roles('CAPTURER', 'VERIFIER', 'ADMIN')
  @Post()
  create(@Body() dto: CreateIndexTestingReferralDto, @Request() req) {
    return this.service.create(dto, req.user.id);
  }

  @Get()
  findByFacility(
    @Query('facilityId') facilityId: string,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Request() req,
  ) {
    return this.service.findByFacility(facilityId, from, to, req.user);
  }
}
