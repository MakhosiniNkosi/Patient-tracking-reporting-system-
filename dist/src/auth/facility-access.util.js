"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertFacilityAccess = assertFacilityAccess;
const common_1 = require("@nestjs/common");
const FACILITY_SCOPED_ROLES = ['CAPTURER', 'VERIFIER'];
function assertFacilityAccess(user, facilityId) {
    if (FACILITY_SCOPED_ROLES.includes(user.role) && user.facilityId !== facilityId) {
        throw new common_1.ForbiddenException('You are not authorized to view reports for this facility.');
    }
}
//# sourceMappingURL=facility-access.util.js.map