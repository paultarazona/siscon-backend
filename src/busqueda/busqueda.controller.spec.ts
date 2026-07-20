import { Test, TestingModule } from '@nestjs/testing';
import { BusquedaController } from './busqueda.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('BusquedaController', () => {
  let controller: BusquedaController;
  let prisma: PrismaService;

  const mockPrisma = {
    medidor: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusquedaController],
      providers: [{ provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    controller = module.get<BusquedaController>(BusquedaController);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('buscar', () => {
    it('busca suministros-medidores con query', async () => {
      mockPrisma.medidor.findMany.mockResolvedValue([
        {
          id: 1,
          numeroMedidor: 'M-001',
          suministroId: 10,
          estado: 'ACTIVO',
          suministro: {
            codigoSuministro: 'SUM-001',
            tipoCliente: 'RESIDENCIAL',
            zona: { nombreZona: 'Piura Centro', distrito: 'Piura' },
          },
        },
      ]);

      const result = await controller.buscar({ query: 'M-001' });

      expect(prisma.medidor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            estado: 'ACTIVO',
          }),
          take: 20,
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        suministroId: 10,
        codigoSuministro: 'SUM-001',
        medidorId: 1,
        numeroMedidor: 'M-001',
        zona: 'Piura Centro',
        distrito: 'Piura',
        tipoCliente: 'RESIDENCIAL',
        estadoMedidor: 'ACTIVO',
      });
    });

    it('busca por zona', async () => {
      mockPrisma.medidor.findMany.mockResolvedValue([
        {
          id: 2,
          numeroMedidor: 'M-002',
          suministroId: 20,
          estado: 'ACTIVO',
          suministro: {
            codigoSuministro: 'SUM-002',
            tipoCliente: 'COMERCIAL',
            zona: { nombreZona: 'Castilla', distrito: 'Castilla' },
          },
        },
      ]);

      const result = await controller.buscar({ query: 'Castilla' });

      expect(result).toHaveLength(1);
      expect(result[0].zona).toBe('Castilla');
    });

    it('retorna array vacío sin resultados', async () => {
      mockPrisma.medidor.findMany.mockResolvedValue([]);

      const result = await controller.buscar({ query: 'NOEXISTE' });

      expect(result).toEqual([]);
    });
  });
});
