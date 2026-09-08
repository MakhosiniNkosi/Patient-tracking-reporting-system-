import { Module } from '@nestjs/common';
import { IndicatorsController } from './indicators.controller';
import { IndicatorsService } from './indicators.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [IndicatorsController],
  providers: [IndicatorsService, PrismaService],
  exports: [IndicatorsService],
})
export class IndicatorsModule {}
