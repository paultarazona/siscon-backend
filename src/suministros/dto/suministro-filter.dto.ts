import { EstadoGeneral, TipoCliente } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class SuministroFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  zonaId?: number;

  @IsOptional()
  @IsEnum(TipoCliente)
  tipoCliente?: TipoCliente;

  @IsOptional()
  @IsEnum(EstadoGeneral)
  estado?: EstadoGeneral;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  observado?: boolean;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
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
