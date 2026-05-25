import { EstadoLectura, TipoCliente } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ReporteFilterDto {
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
}
