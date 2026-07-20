import { mapIncidentToSigom } from './sigom-payload.mapper';

describe('mapIncidentToSigom', () => {
  it('preserva las referencias externas de SISCON para crear una orden', () => {
    const payload = mapIncidentToSigom({
      id: 42,
      tipoIncidencia: 'CONSUMO_ALTO',
      nivel: 'ALTO',
      descripcion: 'Consumo fuera de rango.',
      fechaDeteccion: new Date('2026-07-20T10:00:00.000Z'),
      lectura: {
        observacion: 'Se superó el umbral mensual.',
        medidor: {
          id: 7,
          numeroMedidor: 'MED-000007',
          suministro: {
            id: 5,
            codigoSuministro: 'SUM-000005',
            direccionReferencial: 'Av. Grau 123',
            zona: { id: 3, nombreZona: 'Zona Centro' },
          },
        },
      },
    });

    expect(payload).toEqual({
      incident: {
        externalId: '42',
        code: 'INC-42',
        type: 'CONSUMO_ALTO',
        level: 'HIGH',
        detectedAt: '2026-07-20T10:00:00.000Z',
        description: 'Consumo fuera de rango.',
        readingObservation: 'Se superó el umbral mensual.',
      },
      asset: {
        zone: { externalId: '3', name: 'Zona Centro' },
        supply: { externalId: '5', code: 'SUM-000005' },
        meter: { externalId: '7', code: 'MED-000007' },
        addressSnapshot: 'Av. Grau 123',
      },
    });
  });
});
