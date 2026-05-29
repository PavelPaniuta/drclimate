import { IsDateString, IsEnum, IsOptional, IsString, MinLength, IsNumber, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceType, OrderStatus } from '@prisma/client';
export class CreateOrderDto {
  @IsEnum(ServiceType)
  serviceType!: ServiceType;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsString()
  address!: string;

  @IsString()
  city!: string;

  @IsOptional()
  @IsDateString()
  preferredTime?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}

export class AdminCreateOrderDto extends CreateOrderDto {
  @IsString()
  clientId!: string;
}

export class AdminUpdateOrderDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  address?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @IsOptional()
  price?: number;
}

export class AssignOrderDto {
  @IsString()
  masterId!: string;
}

export class ScheduleOrderDto {
  @IsDateString()
  scheduledAt!: string;
}

export class UpdateMasterNotesDto {
  @IsString()
  masterNotes!: string;
}

export class CreateOrderCommentDto {
  @IsString()
  @MinLength(1)
  content!: string;
}

export class MaterialExpenseDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

export class CompleteOrderDto {
  @IsNumber()
  @Min(0)
  clientPaid!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  transportCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  otherCosts?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialExpenseDto)
  materials?: MaterialExpenseDto[];
}
