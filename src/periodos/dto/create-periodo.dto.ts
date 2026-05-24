import { EstadoGeneral } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
export class CreatePeriodoDto { @IsInt() @Min(2000) anio:number; @IsInt() @Min(1) @Max(12) mes:number; @Type(()=>Date) @IsDate() fechaInicio:Date; @Type(()=>Date) @IsDate() fechaFin:Date; @IsOptional() @IsEnum(EstadoGeneral) estado?:EstadoGeneral; }
