import { PrismaService } from '../prisma/prisma.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { IncidenciasService } from './incidencias.service';

describe('IncidenciasService', () => {
  const prisma = {
    incidencia: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const service = new IncidenciasService(prisma as unknown as PrismaService, {} as IntegrationsService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('filtra incidencias por nivel', async () => {
    prisma.$transaction.mockResolvedValue([[], 0]);

    await service.findAll({ nivel: 'ALTO' });

    expect(prisma.incidencia.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ nivel: 'ALTO' }),
    }));
  });
});
