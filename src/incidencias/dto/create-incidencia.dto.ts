import { TipoIncidencia } from '@prisma/client';
import { IsEnum, IsInt, IsString } from 'class-validator';

export class CreateIncidenciaDto {
  @IsInt()
  lecturaId: number;

  @IsEnum(TipoIncidencia)
  tipoIncidencia: TipoIncidencia;

  @IsString()
  descripcion: string;

  @IsString()
  nivel: string;
}
