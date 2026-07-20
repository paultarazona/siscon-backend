import { ConflictException } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { SigomClient } from './sigom.client';

describe('IntegrationsService', () => {
  const prisma = {
    incidencia: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    integrationInbox: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const sigomClient: jest.Mocked<Pick<SigomClient, 'createWorkOrder'>> = { createWorkOrder: jest.fn() };
  const service = new IntegrationsService(prisma as any, sigomClient as unknown as SigomClient);

  const pendingIncident = {
    id: 42,
    estado: 'PENDIENTE',
    tipoIncidencia: 'CONSUMO_ALTO',
    nivel: 'ALTO',
    descripcion: 'Consumo fuera de rango.',
    fechaDeteccion: new Date('2026-07-20T10:00:00.000Z'),
    lectura: {
      observacion: null,
      medidor: {
        id: 7,
        numeroMedidor: 'MED-000007',
        suministro: {
          id: 5,
          codigoSuministro: 'SUM-000005',
          direccionReferencial: null,
          zona: { id: 3, nombreZona: 'Zona Centro' },
        },
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deriva una incidencia pendiente y guarda la correlación de SIGOM', async () => {
    prisma.incidencia.findUnique.mockResolvedValue(pendingIncident);
    sigomClient.createWorkOrder.mockResolvedValue({ id: 'ot-id', code: 'OT-2026-000001' });
    prisma.incidencia.update.mockResolvedValue({ ...pendingIncident, estado: 'DERIVADA_A_SIGOM' });

    await service.deriveToSigom(42);

    expect(sigomClient.createWorkOrder).toHaveBeenCalledWith(
      expect.objectContaining({ incident: expect.objectContaining({ externalId: '42' }) }),
      'siscon-incident-42',
    );
    expect(prisma.incidencia.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 42 },
        data: expect.objectContaining({
          estado: 'DERIVADA_A_SIGOM',
          sigomWorkOrderId: 'ot-id',
          sigomWorkOrderCode: 'OT-2026-000001',
        }),
      }),
    );
  });

  it('rechaza derivar una incidencia que ya fue enviada a SIGOM', async () => {
    prisma.incidencia.findUnique.mockResolvedValue({ ...pendingIncident, estado: 'DERIVADA_A_SIGOM' });

    await expect(service.deriveToSigom(42)).rejects.toThrow(ConflictException);
    expect(sigomClient.createWorkOrder).not.toHaveBeenCalled();
  });
});
