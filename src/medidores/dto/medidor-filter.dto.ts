import { EstadoMedidor } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class MedidorFilterDto {
  @IsOptional()
  @IsEnum(EstadoMedidor)
  estado?: EstadoMedidor;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  zonaId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  suministroId?: number;

  @IsOptional()
  @IsString()
  marca?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order?: 'asc' | 'desc';
}
