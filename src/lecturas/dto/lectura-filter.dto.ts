import { EstadoLectura } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class LecturaFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  anio?: number;

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
  @Type(() => Number)
  @IsInt()
  suministroId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  medidorId?: number;

  @IsOptional()
  @IsEnum(EstadoLectura)
  estadoLectura?: EstadoLectura;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
