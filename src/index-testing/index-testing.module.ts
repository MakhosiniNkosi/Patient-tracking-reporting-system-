import { Module } from '@nestjs/common';
import { IndexTestingController } from './index-testing.controller';
import { IndexTestingService } from './index-testing.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [IndexTestingController],
  providers: [IndexTestingService, PrismaService],
})
export class IndexTestingModule {}
