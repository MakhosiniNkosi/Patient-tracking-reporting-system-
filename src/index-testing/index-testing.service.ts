import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateIndexTestingReferralDto } from './dto';
import { assertFacilityAccess, RequestUser } from '../auth/facility-access.util';

@Injectable()
export class IndexTestingService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateIndexTestingReferralDto, completedBy: string) {
    return this.prisma.indexTestingReferral.create({
      data: { ...dto, date: new Date(dto.date), completedBy },
    });
  }

  // Matches the paper form's use case: pull one facility's log for a
  // date range (typically a month) to verify and total. This is the most
  // sensitive data in the system — it references individual patient file
  // numbers — so the facility check applies here even more strictly than
  // on the aggregate indicator reports.
  findByFacility(facilityId: string, from: string | undefined, to: string | undefined, user: RequestUser) {
    assertFacilityAccess(user, facilityId);
    return this.prisma.indexTestingReferral.findMany({
      where: {
        facilityId,
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      orderBy: { date: 'asc' },
    });
  }
}
