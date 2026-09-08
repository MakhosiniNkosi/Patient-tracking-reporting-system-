import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class IndicatorsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.indicator.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async findOne(id: string) {
    const indicator = await this.prisma.indicator.findUnique({ where: { id } });
    if (!indicator) throw new NotFoundException('Indicator not found');
    return indicator;
  }

  // Indicators + their target for one cycle, in form order — what the
  // capture screen actually renders (label + target hint per field).
  async findAllWithTargets(cycleId: string) {
    const indicators = await this.prisma.indicator.findMany({ orderBy: { sortOrder: 'asc' } });
    const targets = await this.prisma.indicatorTarget.findMany({ where: { cycleId } });
    const targetByIndicator = new Map(targets.map((t) => [t.indicatorId, t.targetValue]));
    return indicators.map((ind) => ({ ...ind, target: targetByIndicator.get(ind.id) ?? null }));
  }
}
