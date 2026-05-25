import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: PrismaService;

  const mockPrisma = {
    $queryRaw: jest.fn(),
    medidor: { count: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('resumen', () => {
    it('retorna resumen con datos agregados', async () => {
      // $queryRaw se llama 3 veces en Promise.all, medidor.count 1 vez
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ total: 6000 }])       // lecturas
        .mockResolvedValueOnce([{ total: new Prisma.Decimal(150000) }]) // consumo
        .mockResolvedValueOnce([{ total: 50 }]);        // incidencias
      mockPrisma.medidor.count.mockResolvedValue(100);

      const result = await service.resumen({});

      expect(result.totalLecturas).toBe(6000);
      expect(Number(result.consumoTotalKwh)).toBe(150000);
      expect(result.totalIncidencias).toBe(50);
      expect(result.medidoresActivos).toBe(100);
    });

    it('maneja valores vacíos', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrisma.medidor.count.mockResolvedValue(0);

      const result = await service.resumen({});

      expect(result.totalLecturas).toBe(0);
      expect(result.totalIncidencias).toBe(0);
    });

    it('acepta filtros de fecha', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ total: 100 }])
        .mockResolvedValueOnce([{ total: new Prisma.Decimal(5000) }])
        .mockResolvedValueOnce([{ total: 5 }]);
      mockPrisma.medidor.count.mockResolvedValue(20);

      await service.resumen({ anioDesde: 2020, anioHasta: 2024, zonaId: 1 });

      // 3 llamadas a $queryRaw + 1 a medidor.count
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(3);
      expect(mockPrisma.medidor.count).toHaveBeenCalledTimes(1);
    });
  });

  describe('consumoMensual', () => {
    it('retorna consumo agrupado por mes', async () => {
      const mockData = [
        { anio: 2024, mes: 7, consumoKwh: 5000 },
        { anio: 2024, mes: 8, consumoKwh: 6000 },
      ];
      mockPrisma.$queryRaw.mockResolvedValue(mockData);

      const result = await service.consumoMensual({}) as Array<{ anio: number; mes: number; consumoKwh: number }>;

      expect(result).toHaveLength(2);
      expect(result[0].anio).toBe(2024);
    });
  });

  describe('comparativoAnual', () => {
    it('retorna consumo agrupado por año', async () => {
      const mockData = [
        { anio: 2023, consumoKwh: 50000 },
        { anio: 2024, consumoKwh: 60000 },
      ];
      mockPrisma.$queryRaw.mockResolvedValue(mockData);

      const result = await service.comparativoAnual({}) as Array<{ anio: number; consumoKwh: number }>;

      expect(result).toHaveLength(2);
    });
  });

  describe('topSuministros', () => {
    it('retorna top suministros por consumo', async () => {
      const mockData = [
        { codigoSuministro: 'SUM-001', nombreZona: 'Piura Centro', consumoKwh: 10000 },
      ];
      mockPrisma.$queryRaw.mockResolvedValue(mockData);

      const result = await service.topSuministros({}) as Array<{ codigoSuministro: string; nombreZona: string; consumoKwh: number }>;

      expect(result).toHaveLength(1);
      expect(result[0].codigoSuministro).toBe('SUM-001');
    });
  });
});
