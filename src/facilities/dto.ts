import { IsString, IsOptional } from 'class-validator';

export class CreateFacilityDto {
  @IsString()
  name: string;

  @IsString()
  facilityCode: string;

  @IsOptional()
  @IsString()
  district?: string;
}

export class UpdateFacilityDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  district?: string;
}
