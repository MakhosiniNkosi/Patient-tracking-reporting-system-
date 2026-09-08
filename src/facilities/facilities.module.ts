import { Module } from '@nestjs/common';
import { FacilitiesController } from './facilities.controller';
import { FacilitiesService } from './facilities.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [FacilitiesController],
  providers: [FacilitiesService, PrismaService],
  exports: [FacilitiesService],
})
export class FacilitiesModule {}
