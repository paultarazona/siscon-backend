import { TipoIncidencia } from '@prisma/client';

export type IncidenciaAutomatica = {
  tipoIncidencia: TipoIncidencia;
  descripcion: string;
  nivel: 'MEDIO' | 'ALTO';
};

export function calcularConsumoKwh(lecturaAnterior: number, lecturaActual: number) {
  return lecturaActual - lecturaAnterior;
}

export function esLecturaRegresiva(lecturaAnterior: number, lecturaActual: number) {
  return lecturaActual < lecturaAnterior;
}

export function detectarIncidenciaPorConsumo(consumoKwh: number): IncidenciaAutomatica | null {
  if (consumoKwh > 1000) {
    return {
      tipoIncidencia: TipoIncidencia.CONSUMO_ALTO,
      descripcion: `Consumo inusualmente alto: ${consumoKwh} kWh`,
      nivel: consumoKwh > 2000 ? 'ALTO' : 'MEDIO',
    };
  }

  if (consumoKwh < 10) {
    return {
      tipoIncidencia: TipoIncidencia.CONSUMO_BAJO,
      descripcion: `Consumo inusualmente bajo: ${consumoKwh} kWh`,
      nivel: 'MEDIO',
    };
  }

  return null;
}
