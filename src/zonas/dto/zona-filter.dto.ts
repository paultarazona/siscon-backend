import { EstadoGeneral } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const EmptyToUndefined = () => Transform(({ value }) => value === '' ? undefined : value);

export class ZonaFilterDto {
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  q?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  departamento?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  provincia?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  distrito?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsEnum(EstadoGeneral)
  estado?: EstadoGeneral;

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

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsEnum(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'asc';
}
