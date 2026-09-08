import { IsUUID, IsString, IsArray, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class WeeklyEntryInputDto {
  @IsUUID()
  indicatorId: string;

  @IsOptional()
  @IsNumber()
  value?: number; // omitted or blank on the client means "0" — see service
}

export class CreateWeeklyReportDto {
  @IsUUID()
  facilityId: string;

  @IsUUID()
  cycleId: string;

  @IsString()
  month: string;

  @IsString()
  weekLabel: string; // e.g. "Week 1" or "06-12 Jul"

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeeklyEntryInputDto)
  entries: WeeklyEntryInputDto[];
}
