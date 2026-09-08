import { Body, Controller, Get, Param, Patch, Post, Query, Res, UseGuards, Request } from '@nestjs/common';
import type { Response } from 'express';
import { MonthlyReportsService } from './monthly-reports.service';
import { CreateMonthlyReportDto, VerifyMonthlyReportDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('monthly-reports')
export class MonthlyReportsController {
  constructor(private readonly service: MonthlyReportsService) {}

  @Roles('CAPTURER', 'PROGRAM_MANAGER', 'ADMIN')
  @Post()
  upsert(@Body() dto: CreateMonthlyReportDto, @Request() req) {
    return this.service.upsert(dto, req.user.id);
  }

  // Lookup by facility/cycle/month — what the capture screen calls to load
  // (or reload, on month change) whatever's already saved, including
  // totals synced in from weekly reports. Returns null, not 404, when
  // nothing's been saved for this month yet.
  //
  // @Res() + explicit res.json() rather than a plain return: Nest's
  // default handling sends NO response body at all for a null/undefined
  // return value (not even a literal "null"), which broke every client
  // whose JSON parser expects a real body — an empty body isn't valid
  // JSON. This guarantees the wire response is always real JSON, so a
  // "not found yet" result is indistinguishable in shape from any other
  // response, just with a null value.
  @Get()
  async findByFacilityCycleMonth(
    @Query('facilityId') facilityId: string,
    @Query('cycleId') cycleId: string,
    @Query('month') month: string,
    @Request() req,
    @Res() res: Response,
  ) {
    const report = await this.service.findByFacilityCycleMonth(facilityId, cycleId, month, req.user);
    res.json(report);
  }

  // All monthly reports for a facility/cycle (every month that has at
  // least been saved once) — what the "all reports" browsing screen lists.
  // Placed before @Get(':id') so "all" is never swallowed as an :id value.
  @Get('all')
  findAllForFacility(
    @Query('facilityId') facilityId: string,
    @Query('cycleId') cycleId: string,
    @Request() req,
  ) {
    return this.service.findAllForFacility(facilityId, cycleId, req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.service.findOneForUser(id, req.user);
  }

  // @Res() takes over the response entirely (bypassing Nest's default JSON
  // serialization) so we can set download-triggering headers directly.
  @Get(':id/export')
  async export(@Param('id') id: string, @Res() res: Response, @Request() req) {
    const { csv, filename } = await this.service.exportCsv(id, req.user);
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(csv);
  }

  @Roles('CAPTURER', 'PROGRAM_MANAGER', 'ADMIN')
  @Patch(':id/submit')
  submit(@Param('id') id: string) {
    return this.service.submit(id);
  }

  @Roles('VERIFIER', 'ADMIN')
  @Patch(':id/verify')
  verify(@Param('id') id: string, @Body() dto: VerifyMonthlyReportDto) {
    return this.service.verify(id, dto);
  }

  @Get('trend/:facilityId/:cycleId/:indicatorId')
  trend(
    @Param('facilityId') facilityId: string,
    @Param('cycleId') cycleId: string,
    @Param('indicatorId') indicatorId: string,
    @Request() req,
  ) {
    return this.service.indicatorTrend(facilityId, cycleId, indicatorId, req.user);
  }
}
