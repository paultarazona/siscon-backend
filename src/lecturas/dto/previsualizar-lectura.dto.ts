import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class PrevisualizarLecturaDto {
  @Type(() => Number)
  @IsNumber()
  lecturaAnterior: number;

  @Type(() => Number)
  @IsNumber()
  lecturaActual: number;
}
