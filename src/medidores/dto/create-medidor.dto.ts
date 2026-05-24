import { EstadoMedidor } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
export class CreateMedidorDto { @IsString() numeroMedidor:string; @IsInt() suministroId:number; @IsOptional() @IsString() marca?:string; @IsOptional() @IsString() modelo?:string; @IsOptional() @Type(()=>Date) @IsDate() fechaInstalacion?:Date; @IsOptional() @IsEnum(EstadoMedidor) estado?:EstadoMedidor; }
