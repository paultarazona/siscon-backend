import { Type } from 'class-transformer';
import { IsDate, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
export class CreateLecturaDto { @IsInt() medidorId:number; @IsInt() periodoId:number; @Type(()=>Number) @IsNumber() lecturaAnterior:number; @Type(()=>Number) @IsNumber() lecturaActual:number; @Type(()=>Date) @IsDate() fechaLectura:Date; @IsOptional() @IsString() observacion?:string; }
