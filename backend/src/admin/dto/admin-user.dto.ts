import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceType } from '@prisma/client';

export class AdminMasterProfilePatchDto {
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

  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

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

export class AdminUpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  telegram?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsBoolean()
  isBanned?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminMasterProfilePatchDto)
  masterProfile?: AdminMasterProfilePatchDto;
}
