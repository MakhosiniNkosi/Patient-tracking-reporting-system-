import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateFacilityDto, UpdateFacilityDto } from './dto';

@Injectable()
export class FacilitiesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.facility.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const facility = await this.prisma.facility.findUnique({ where: { id } });
    if (!facility) throw new NotFoundException('Facility not found');
    return facility;
  }

  create(dto: CreateFacilityDto) {
    return this.prisma.facility.create({ data: dto });
  }

  async update(id: string, dto: UpdateFacilityDto) {
    await this.findOne(id);
    return this.prisma.facility.update({ where: { id }, data: dto });
  }
}
