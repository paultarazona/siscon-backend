import { EstadoMedidor } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMedidorDto {
  @IsString()
  numeroMedidor: string;

  @IsInt()
  suministroId: number;

  @IsString()
  @IsNotEmpty()
  marca: string;

  @IsString()
  @IsNotEmpty()
  modelo: string;

  @Type(() => Date)
  @IsDate()
  fechaInstalacion: Date;

  @IsOptional()
  @IsEnum(EstadoMedidor)
  estado?: EstadoMedidor;
}
