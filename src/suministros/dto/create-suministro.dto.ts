import { EstadoGeneral, TipoCliente } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSuministroDto {
  @IsString()
  codigoSuministro: string;

  @IsEnum(TipoCliente)
  tipoCliente: TipoCliente;

  @IsString()
  @IsNotEmpty()
  direccionReferencial: string;

  @IsInt()
  zonaId: number;

  @IsOptional()
  @IsEnum(EstadoGeneral)
  estado?: EstadoGeneral;
}
