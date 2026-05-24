import { IsString } from 'class-validator';

export class ImportacionCsvDto {
  @IsString()
  codigo_suministro: string;

  @IsString()
  numero_medidor: string;

  @IsString()
  zona: string;

  @IsString()
  tipo_cliente: string;

  @IsString()
  anio: string;

  @IsString()
  mes: string;

  @IsString()
  lectura_anterior: string;

  @IsString()
  lectura_actual: string;

  @IsString()
  fecha_lectura: string;
}
