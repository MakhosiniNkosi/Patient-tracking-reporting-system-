import { Controller, Get, Injectable, Module, Post, UseGuards, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Injectable()
class CyclesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.performanceCycle.findMany({ orderBy: { startDate: 'desc' } });
  }

  // Creates the next Oct→Sep cycle after whichever one currently starts
  // latest — "2025/2026" becomes "2026/2027", matching the way these
  // performance cycles are actually named. If none exist yet, anchors to
  // the current calendar year so the first cycle created still lands on a
  // sensible Oct→Sep window.
  async createNext() {
    const latest = await this.prisma.performanceCycle.findFirst({
      orderBy: { startDate: 'desc' },
    });

    const startYear = latest ? new Date(latest.startDate).getUTCFullYear() + 1 : new Date().getUTCFullYear();
    const label = `${startYear}/${startYear + 1}`;

    const existing = await this.prisma.performanceCycle.findUnique({ where: { label } });
    if (existing) {
      throw new ConflictException(`Cycle ${label} already exists.`);
    }

    return this.prisma.performanceCycle.create({
      data: {
        label,
        startDate: new Date(Date.UTC(startYear, 9, 1)), // October 1
        endDate: new Date(Date.UTC(startYear + 1, 8, 30)), // September 30
      },
    });
  }
}

@UseGuards(JwtAuthGuard)
@Controller('performance-cycles')
class CyclesController {
  constructor(private readonly service: CyclesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('next')
  createNext() {
    return this.service.createNext();
  }
}

@Module({
  controllers: [CyclesController],
  providers: [CyclesService, PrismaService],
})
export class CyclesModule {}
