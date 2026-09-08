import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { IndicatorsService } from './indicators.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('indicators')
export class IndicatorsController {
  constructor(private readonly service: IndicatorsService) {}

  // ?cycleId=... returns each indicator with its target for that cycle —
  // this is the shape the mobile capture screen actually wants.
  @Get()
  findAll(@Query('cycleId') cycleId?: string) {
    return cycleId ? this.service.findAllWithTargets(cycleId) : this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
