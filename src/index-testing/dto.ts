import { IsUUID, IsString, IsDateString, IsArray, IsOptional } from 'class-validator';

export class CreateIndexTestingReferralDto {
  @IsUUID()
  facilityId: string;

  @IsDateString()
  date: string;

  @IsString()
  fileNo: string;

  @IsArray()
  @IsString({ each: true })
  riskReasons: string[]; // e.g. ["UNSUPPRESSED_VL", "NEW_STI", "RE_ENGAGEMENT", "TROA"]

  @IsOptional()
  @IsString()
  otherRisk?: string;

  @IsString()
  receivedBy: string; // counsellor name
}
