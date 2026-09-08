import { Module } from '@nestjs/common';
import { MonthlyReportsController } from './monthly-reports.controller';
import { MonthlyReportsService } from './monthly-reports.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [MonthlyReportsController],
  providers: [MonthlyReportsService, PrismaService],
  exports: [MonthlyReportsService],
})
export class MonthlyReportsModule {}
