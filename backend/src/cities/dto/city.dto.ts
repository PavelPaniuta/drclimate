import { IsBoolean, IsInt, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreateCityDto {
  @IsString()
  @MinLength(2)
  @Matches(/^[a-z0-9-]+$/, { message: 'slug must be lowercase latin (e.g. kyiv, dnipro)' })
  slug!: string;

  @IsString()
  nameUk!: string;

  @IsString()
  nameRu!: string;

  @IsString()
  nameEn!: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateCityDto {
  @IsOptional()
  @IsString()
  nameUk?: string;

  @IsOptional()
  @IsString()
  nameRu?: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
