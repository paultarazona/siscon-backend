import { TipoIncidencia } from '@prisma/client';
import { calcularConsumoKwh, esLecturaRegresiva, detectarIncidenciaPorConsumo } from './lectura.rules';

describe('Lectura Rules (Domain)', () => {
  describe('calcularConsumoKwh', () => {
    it('calcula consumo normal', () => {
      expect(calcularConsumoKwh(100, 250)).toBe(150);
    });

    it('retorna 0 cuando lectura anterior igual a actual', () => {
      expect(calcularConsumoKwh(100, 100)).toBe(0);
    });

    it('acepta valores grandes', () => {
      expect(calcularConsumoKwh(0, 99999)).toBe(99999);
    });
  });

  describe('esLecturaRegresiva', () => {
    it('detecta lectura regresiva', () => {
      expect(esLecturaRegresiva(200, 150)).toBe(true);
    });

    it('retorna false cuando lectura actual es mayor', () => {
      expect(esLecturaRegresiva(100, 200)).toBe(false);
    });

    it('retorna false cuando son iguales', () => {
      expect(esLecturaRegresiva(100, 100)).toBe(false);
    });
  });

  describe('detectarIncidenciaPorConsumo', () => {
    it('detecta consumo alto (>1000)', () => {
      const result = detectarIncidenciaPorConsumo(1500);
      expect(result).not.toBeNull();
      expect(result!.tipoIncidencia).toBe(TipoIncidencia.CONSUMO_ALTO);
      expect(result!.nivel).toBe('MEDIO');
    });

    it('detecta consumo alto crítico (>2000)', () => {
      const result = detectarIncidenciaPorConsumo(2500);
      expect(result).not.toBeNull();
      expect(result!.tipoIncidencia).toBe(TipoIncidencia.CONSUMO_ALTO);
      expect(result!.nivel).toBe('ALTO');
    });

    it('detecta consumo bajo (<10)', () => {
      const result = detectarIncidenciaPorConsumo(5);
      expect(result).not.toBeNull();
      expect(result!.tipoIncidencia).toBe(TipoIncidencia.CONSUMO_BAJO);
      expect(result!.nivel).toBe('MEDIO');
    });

    it('no detecta incidencia en rango normal', () => {
      expect(detectarIncidenciaPorConsumo(100)).toBeNull();
      expect(detectarIncidenciaPorConsumo(500)).toBeNull();
      expect(detectarIncidenciaPorConsumo(999)).toBeNull();
    });

    it('frontera exacta: 1000 no genera incidencia', () => {
      expect(detectarIncidenciaPorConsumo(1000)).toBeNull();
    });

    it('frontera exacta: 1001 genera consumo alto', () => {
      const result = detectarIncidenciaPorConsumo(1001);
      expect(result!.tipoIncidencia).toBe(TipoIncidencia.CONSUMO_ALTO);
    });

    it('frontera exacta: 10 no genera incidencia', () => {
      expect(detectarIncidenciaPorConsumo(10)).toBeNull();
    });

    it('frontera exacta: 9 genera consumo bajo', () => {
      const result = detectarIncidenciaPorConsumo(9);
      expect(result!.tipoIncidencia).toBe(TipoIncidencia.CONSUMO_BAJO);
    });
  });
});
