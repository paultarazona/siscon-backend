import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { DashboardService } from '../src/dashboard/dashboard.service';
import { DashboardModule } from '../src/dashboard/dashboard.module';
import { LecturasModule } from '../src/lecturas/lecturas.module';
import { LecturasService } from '../src/lecturas/application/lecturas.service';
import { cleanDatabase, seedTestData } from './integration-helpers';

describe('DashboardService (Integration)', () => {
  let app: INestApplication;
  let dashboardService: DashboardService;
  let lecturasService: LecturasService;
  let prisma: PrismaService;
  let testData: Awaited<ReturnType<typeof seedTestData>>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [DashboardModule, LecturasModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dashboardService = moduleFixture.get<DashboardService>(DashboardService);
    lecturasService = moduleFixture.get<LecturasService>(LecturasService);
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
    testData = await seedTestData(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('resumen', () => {
    it('returns zero counts when no data exists', async () => {
      const result = await dashboardService.resumen({});

      expect(result.totalLecturas).toBe(0);
      expect(Number(result.consumoTotalKwh)).toBe(0);
      expect(result.totalIncidencias).toBe(0);
      expect(result.medidoresActivos).toBe(1); // seeded medidor is ACTIVE
    });

    it('returns aggregated counts after creating lecturas', async () => {
      // Create lecturas for different medidor/periodo combinations
      const suministro2 = await prisma.suministro.create({
        data: {
          codigoSuministro: 'SUM-TEST-002',
          tipoCliente: 'COMERCIAL',
          zonaId: testData.zone.id,
        },
      });
      const medidor2 = await prisma.medidor.create({
        data: {
          numeroMedidor: 'M-TEST-002',
          suministroId: suministro2.id,
          marca: 'TestBrand2',
        },
      });

      await lecturasService.create(
        {
          medidorId: testData.medidor.id,
          periodoId: testData.periodo1.id,
          lecturaAnterior: 100,
          lecturaActual: 200,
          fechaLectura: new Date(),
        },
        testData.user.id,
      );
      await lecturasService.create(
        {
          medidorId: medidor2.id,
          periodoId: testData.periodo1.id,
          lecturaAnterior: 50,
          lecturaActual: 150,
          fechaLectura: new Date(),
        },
        testData.user.id,
      );
      await lecturasService.create(
        {
          medidorId: testData.medidor.id,
          periodoId: testData.periodo2.id,
          lecturaAnterior: 200,
          lecturaActual: 300,
          fechaLectura: new Date(),
        },
        testData.user.id,
      );

      const result = await dashboardService.resumen({});

      expect(result.totalLecturas).toBe(3);
      expect(Number(result.consumoTotalKwh)).toBe(300); // 100 + 100 + 100
      expect(result.medidoresActivos).toBe(2); // both medidores are ACTIVE
    });

    it('filters resumen by year', async () => {
      await lecturasService.create(
        {
          medidorId: testData.medidor.id,
          periodoId: testData.periodo1.id,
          lecturaAnterior: 100,
          lecturaActual: 200,
          fechaLectura: new Date(),
        },
        testData.user.id,
      );

      const resultFiltered = await dashboardService.resumen({ anioDesde: 2024, anioHasta: 2024 });
      const resultOther = await dashboardService.resumen({ anioDesde: 2025, anioHasta: 2025 });

      expect(resultFiltered.totalLecturas).toBe(1);
      expect(resultOther.totalLecturas).toBe(0);
    });
  });

  describe('consumoMensual', () => {
    it('returns consumption grouped by month', async () => {
      await lecturasService.create(
        {
          medidorId: testData.medidor.id,
          periodoId: testData.periodo1.id,
          lecturaAnterior: 100,
          lecturaActual: 200,
          fechaLectura: new Date(),
        },
        testData.user.id,
      );

      await lecturasService.create(
        {
          medidorId: testData.medidor.id,
          periodoId: testData.periodo2.id,
          lecturaAnterior: 200,
          lecturaActual: 350,
          fechaLectura: new Date(),
        },
        testData.user.id,
      );

      const result = await dashboardService.consumoMensual({}) as Array<{ anio: number; mes: number; consumoKwh: unknown }>;

      expect(result).toHaveLength(2);
      expect(result.find((r) => r.mes === 7)).toBeDefined();
      expect(result.find((r) => r.mes === 8)).toBeDefined();
    });
  });

  describe('comparativoAnual', () => {
    it('returns consumption grouped by year', async () => {
      await lecturasService.create(
        {
          medidorId: testData.medidor.id,
          periodoId: testData.periodo1.id,
          lecturaAnterior: 100,
          lecturaActual: 200,
          fechaLectura: new Date(),
        },
        testData.user.id,
      );

      const result = await dashboardService.comparativoAnual({}) as Array<{ anio: number; consumoKwh: unknown }>;

      expect(result).toHaveLength(1);
      expect(result[0].anio).toBe(2024);
    });
  });

  describe('consumoPorZona', () => {
    it('returns consumption grouped by zone', async () => {
      await lecturasService.create(
        {
          medidorId: testData.medidor.id,
          periodoId: testData.periodo1.id,
          lecturaAnterior: 100,
          lecturaActual: 200,
          fechaLectura: new Date(),
        },
        testData.user.id,
      );

      const result = await dashboardService.consumoPorZona({}) as Array<{ nombreZona: string; consumoKwh: unknown }>;

      expect(result).toHaveLength(1);
      expect(result[0].nombreZona).toBe('Piura Centro');
    });
  });

  describe('consumoPorTipoCliente', () => {
    it('returns consumption grouped by client type', async () => {
      await lecturasService.create(
        {
          medidorId: testData.medidor.id,
          periodoId: testData.periodo1.id,
          lecturaAnterior: 100,
          lecturaActual: 200,
          fechaLectura: new Date(),
        },
        testData.user.id,
      );

      const result = await dashboardService.consumoPorTipoCliente({}) as Array<{ tipoCliente: string; consumoKwh: unknown }>;

      expect(result).toHaveLength(1);
      expect(result[0].tipoCliente).toBe('RESIDENCIAL');
    });
  });

  describe('topSuministros', () => {
    it('returns top supplies by consumption', async () => {
      await lecturasService.create(
        {
          medidorId: testData.medidor.id,
          periodoId: testData.periodo1.id,
          lecturaAnterior: 100,
          lecturaActual: 500,
          fechaLectura: new Date(),
        },
        testData.user.id,
      );

      const result = await dashboardService.topSuministros({}) as Array<{ codigoSuministro: string; consumoKwh: unknown }>;

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].codigoSuministro).toBe('SUM-TEST-001');
    });
  });
});
