import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { BusquedaController } from '../src/busqueda/busqueda.controller';
import { BusquedaModule } from '../src/busqueda/busqueda.module';
import { cleanDatabase, seedTestData } from './integration-helpers';

describe('BusquedaController (Integration)', () => {
  let app: INestApplication;
  let controller: BusquedaController;
  let prisma: PrismaService;
  let testData: Awaited<ReturnType<typeof seedTestData>>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [BusquedaModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    controller = moduleFixture.get<BusquedaController>(BusquedaController);
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
    testData = await seedTestData(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('buscar', () => {
    it('finds medidor by numeroMedidor', async () => {
      const result = await controller.buscar({ query: 'M-TEST-001' });

      expect(result).toHaveLength(1);
      expect(result[0].numeroMedidor).toBe('M-TEST-001');
      expect(result[0].codigoSuministro).toBe('SUM-TEST-001');
      expect(result[0].zona).toBe('Piura Centro');
      expect(result[0].distrito).toBe('Piura');
      expect(result[0].tipoCliente).toBe('RESIDENCIAL');
      expect(result[0].estadoMedidor).toBe('ACTIVO');
    });

    it('finds medidor by codigoSuministro', async () => {
      const result = await controller.buscar({ query: 'SUM-TEST-001' });

      expect(result).toHaveLength(1);
      expect(result[0].medidorId).toBe(testData.medidor.id);
    });

    it('finds medidor by zona name', async () => {
      const result = await controller.buscar({ query: 'Piura Centro' });

      expect(result).toHaveLength(1);
      expect(result[0].zona).toBe('Piura Centro');
    });

    it('finds medidor by distrito', async () => {
      const result = await controller.buscar({ query: 'Piura' });

      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('search is case insensitive', async () => {
      const result = await controller.buscar({ query: 'm-test-001' });

      expect(result).toHaveLength(1);
    });

    it('returns empty array when no match', async () => {
      const result = await controller.buscar({ query: 'NONEXISTENT' });

      expect(result).toHaveLength(0);
    });

    it('only returns ACTIVE medidores', async () => {
      await prisma.medidor.update({
        where: { id: testData.medidor.id },
        data: { estado: 'RETIRADO' },
      });

      const result = await controller.buscar({ query: 'M-TEST' });

      expect(result).toHaveLength(0);
    });

    it('returns max 20 results', async () => {
      // Create 25 additional medidores
      for (let i = 2; i <= 26; i++) {
        await prisma.medidor.create({
          data: {
            numeroMedidor: `M-TEST-${String(i).padStart(3, '0')}`,
            suministroId: testData.suministro.id,
          },
        });
      }

      const result = await controller.buscar({ query: 'M-TEST' });

      expect(result.length).toBeLessThanOrEqual(20);
    });

    it('returns multiple results for partial match', async () => {
      await prisma.medidor.create({
        data: {
          numeroMedidor: 'M-TEST-002',
          suministroId: testData.suministro.id,
        },
      });

      const result = await controller.buscar({ query: 'M-TEST' });

      expect(result.length).toBe(2);
    });
  });
});
