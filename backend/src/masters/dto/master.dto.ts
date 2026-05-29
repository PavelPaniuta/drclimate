import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ServiceType } from '@prisma/client';

export class UpdateMasterProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  serviceArea?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(ServiceType, { each: true })
  skills?: ServiceType[];
}

export class UpdateMasterWorkSettingsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxJobsPerDay?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  workDayStart?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  workDayEnd?: number;
}

export class UpdateAvailabilityDto {
  @IsBoolean()
  isOnline!: boolean;
}
