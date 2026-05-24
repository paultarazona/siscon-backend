import { EstadoGeneral, TipoCliente } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
export class CreateSuministroDto { @IsString() codigoSuministro:string; @IsEnum(TipoCliente) tipoCliente:TipoCliente; @IsOptional() @IsString() direccionReferencial?:string; @IsInt() zonaId:number; @IsOptional() @IsEnum(EstadoGeneral) estado?:EstadoGeneral; }
