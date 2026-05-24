import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class UltimaLecturaQueryDto {
  @Type(() => Number)
  @IsInt()
  medidorId: number;
}
