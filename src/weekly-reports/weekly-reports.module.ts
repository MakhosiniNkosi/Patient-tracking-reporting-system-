import { Module } from '@nestjs/common';
import { WeeklyReportsController } from './weekly-reports.controller';
import { WeeklyReportsService } from './weekly-reports.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [WeeklyReportsController],
  providers: [WeeklyReportsService, PrismaService],
  exports: [WeeklyReportsService],
})
export class WeeklyReportsModule {}
