import { ForbiddenException } from '@nestjs/common';

export interface RequestUser {
  id: string;
  role: string;
  facilityId: string | null;
}

// PROGRAM_MANAGER and ADMIN can view any facility's reports (oversight
// roles). CAPTURER and VERIFIER are scoped to the facility on their own
// account — set at registration, carried in their JWT — so they can view
// their own facility's reports but not another facility's.
const FACILITY_SCOPED_ROLES = ['CAPTURER', 'VERIFIER'];

export function assertFacilityAccess(user: RequestUser, facilityId: string) {
  if (FACILITY_SCOPED_ROLES.includes(user.role) && user.facilityId !== facilityId) {
    throw new ForbiddenException('You are not authorized to view reports for this facility.');
  }
}
