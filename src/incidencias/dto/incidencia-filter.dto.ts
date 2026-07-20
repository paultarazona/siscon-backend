import { EstadoIncidencia, TipoIncidencia } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class IncidenciaFilterDto {
  @IsOptional()
  @IsEnum(TipoIncidencia)
  tipoIncidencia?: TipoIncidencia;

  @IsOptional()
  @IsEnum(EstadoIncidencia)
  estado?: EstadoIncidencia;

  @IsOptional()
  @IsIn(['BAJO', 'MEDIO', 'ALTO', 'CRITICO'])
  nivel?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  anio?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsInt()
  mes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  zonaId?: number;

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
