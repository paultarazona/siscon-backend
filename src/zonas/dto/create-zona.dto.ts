import { EstadoGeneral } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
export class CreateZonaDto { @IsString() departamento: string; @IsString() provincia: string; @IsString() distrito: string; @IsString() nombreZona: string; @IsString() codigoZona: string; @IsOptional() @IsEnum(EstadoGeneral) estado?: EstadoGeneral; }
