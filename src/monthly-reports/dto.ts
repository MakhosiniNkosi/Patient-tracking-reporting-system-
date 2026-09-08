import { IsUUID, IsString, IsArray, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class EntryInputDto {
  @IsUUID()
  indicatorId: string;

  @IsNumber()
  value: number;
}

export class CreateMonthlyReportDto {
  @IsUUID()
  facilityId: string;

  @IsUUID()
  cycleId: string;

  @IsString()
  month: string; // "Oct" | "Nov" | ... | "Sep"

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntryInputDto)
  entries: EntryInputDto[];
}

export class VerifyMonthlyReportDto {
  @IsString()
  verifiedBy: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
