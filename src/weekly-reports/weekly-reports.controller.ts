import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseGuards, Request } from '@nestjs/common';
import type { Response } from 'express';
import { WeeklyReportsService } from './weekly-reports.service';
import { CreateWeeklyReportDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('weekly-reports')
export class WeeklyReportsController {
  constructor(private readonly service: WeeklyReportsService) {}

  // Saving here also syncs this week's values into the matching
  // MonthlyReport's totals automatically — see WeeklyReportsService.upsert.
  @Roles('CAPTURER', 'PROGRAM_MANAGER', 'ADMIN')
  @Post()
  upsert(@Body() dto: CreateWeeklyReportDto, @Request() req) {
    return this.service.upsert(dto, req.user.id);
  }

  @Get()
  findByMonth(
    @Query('facilityId') facilityId: string,
    @Query('cycleId') cycleId: string,
    @Query('month') month: string,
    @Request() req,
  ) {
    return this.service.findByMonth(facilityId, cycleId, month, req.user);
  }

  // Every week across every month for a facility/cycle — what the
  // "all reports" browsing screen lists. Placed before @Get(':id') so
  // "all" is never swallowed as an :id value. includeArchived=true is the
  // ADMIN-only "show archived" toggle on that screen.
  @Get('all')
  findAllForFacility(
    @Query('facilityId') facilityId: string,
    @Query('cycleId') cycleId: string,
    @Query('includeArchived') includeArchived: string,
    @Request() req,
  ) {
    return this.service.findAllForFacility(facilityId, cycleId, req.user, includeArchived === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.service.findOneForUser(id, req.user);
  }

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

  // ADMIN-only. Soft-hide, reversible — see WeeklyReportsService.archive.
  @Roles('ADMIN')
  @Patch(':id/archive')
  archive(@Param('id') id: string) {
    return this.service.archive(id);
  }

  @Roles('ADMIN')
  @Patch(':id/unarchive')
  unarchive(@Param('id') id: string) {
    return this.service.unarchive(id);
  }

  // ADMIN-only. Permanent, and also reverses this week's contribution out
  // of the matching monthly report's totals — see WeeklyReportsService.remove.
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
