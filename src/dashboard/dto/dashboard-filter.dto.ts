import { EstadoLectura, TipoCliente, TipoIncidencia } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class DashboardFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  anioDesde?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  anioHasta?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  mes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  zonaId?: number;

  @IsOptional()
  @IsString()
  distrito?: string;

  @IsOptional()
  @IsEnum(TipoCliente)
  tipoCliente?: TipoCliente;

  @IsOptional()
  @IsEnum(EstadoLectura)
  estadoLectura?: EstadoLectura;

  @IsOptional()
  @IsEnum(TipoIncidencia)
  tipoIncidencia?: TipoIncidencia;

  /** Compatibilidad temporal con clientes que enviaban ?anio=YYYY. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  anio?: number;
}
