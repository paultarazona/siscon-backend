import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EstadoGeneral, TipoCliente } from '@prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';
import { SuministrosService } from '../src/suministros/suministros.service';
import { SuministrosModule } from '../src/suministros/suministros.module';
import { cleanDatabase, seedTestData } from './integration-helpers';

describe('SuministrosService (Integration)', () => {
  let app: INestApplication;
  let service: SuministrosService;
  let prisma: PrismaService;
  let testData: Awaited<ReturnType<typeof seedTestData>>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [SuministrosModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    service = moduleFixture.get<SuministrosService>(SuministrosService);
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
    testData = await seedTestData(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('findAll', () => {
    it('returns paginated suministros with metadata', async () => {
      // Create additional suministros
      for (let i = 2; i <= 5; i++) {
        await prisma.suministro.create({
          data: {
            codigoSuministro: `SUM-TEST-00${i}`,
            tipoCliente: TipoCliente.COMERCIAL,
            zonaId: testData.zone.id,
          },
        });
      }

      const result = await service.findAll({ page: 1, limit: 3 });

      expect(result.data.length).toBeLessThanOrEqual(3);
      expect(result.meta.total).toBe(5);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(3);
      expect(result.meta.totalPages).toBe(2);
      expect(result.meta.hasNextPage).toBe(true);
    });

    it('filters by zonaId', async () => {
      const otherZone = await prisma.zonaOperativa.create({
        data: {
          departamento: 'Piura',
          provincia: 'Piura',
          distrito: 'Castilla',
          nombreZona: 'Castilla',
          codigoZona: 'Z-TEST-002',
        },
      });

      await prisma.suministro.create({
        data: {
          codigoSuministro: 'SUM-OTHER-ZONE',
          tipoCliente: TipoCliente.RESIDENCIAL,
          zonaId: otherZone.id,
        },
      });

      const result = await service.findAll({ zonaId: testData.zone.id });

      expect(result.meta.total).toBe(1);
      expect(result.data[0].zonaId).toBe(testData.zone.id);
    });

    it('filters by tipoCliente', async () => {
      await prisma.suministro.create({
        data: {
          codigoSuministro: 'SUM-COMERCIAL',
          tipoCliente: TipoCliente.COMERCIAL,
          zonaId: testData.zone.id,
        },
      });

      const result = await service.findAll({ tipoCliente: TipoCliente.RESIDENCIAL });

      expect(result.meta.total).toBe(1);
      expect(result.data[0].tipoCliente).toBe(TipoCliente.RESIDENCIAL);
    });

    it('filters by search on codigoSuministro', async () => {
      const result = await service.findAll({ search: 'SUM-TEST' });

      expect(result.meta.total).toBe(1);
      expect(result.data[0].codigoSuministro).toBe('SUM-TEST-001');
    });

    it('search is case insensitive', async () => {
      const result = await service.findAll({ search: 'sum-test' });

      expect(result.meta.total).toBe(1);
    });

    it('orders by fechaAlta desc by default', async () => {
      await prisma.suministro.create({
        data: {
          codigoSuministro: 'SUM-OLDER',
          tipoCliente: TipoCliente.RESIDENCIAL,
          zonaId: testData.zone.id,
          fechaAlta: new Date('2020-01-01'),
        },
      });

      const result = await service.findAll({ sortBy: 'fechaAlta', order: 'desc' });

      expect(result.data[0].codigoSuministro).toBe('SUM-TEST-001');
    });

    it('returns empty page when no data matches', async () => {
      const result = await service.findAll({ search: 'NONEXISTENT' });

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('returns a suministro with zone included', async () => {
      const result = await service.findOne(testData.suministro.id);

      expect(result.id).toBe(testData.suministro.id);
      expect(result.zona).toBeDefined();
      expect(result.zona.nombreZona).toBe('Piura Centro');
    });

    it('throws NotFoundException for non-existent id', async () => {
      await expect(service.findOne(99999)).rejects.toThrow('Suministro no encontrado');
    });
  });

  describe('create', () => {
    it('creates a new suministro', async () => {
      const result = await service.create({
        codigoSuministro: 'SUM-NEW-001',
        tipoCliente: TipoCliente.INDUSTRIAL,
        direccionReferencial: 'Av. Industrial 101',
        zonaId: testData.zone.id,
      });

      expect(result.codigoSuministro).toBe('SUM-NEW-001');
      expect(result.tipoCliente).toBe(TipoCliente.INDUSTRIAL);
      expect(result.zonaId).toBe(testData.zone.id);
      expect(result.estado).toBe(EstadoGeneral.ACTIVO);
    });
  });

  describe('update', () => {
    it('updates an existing suministro', async () => {
      const result = await service.update(testData.suministro.id, {
        tipoCliente: TipoCliente.COMERCIAL,
      });

      expect(result.tipoCliente).toBe(TipoCliente.COMERCIAL);
    });

    it('throws NotFoundException for non-existent id', async () => {
      await expect(
        service.update(99999, { tipoCliente: TipoCliente.COMERCIAL }),
      ).rejects.toThrow('Suministro no encontrado');
    });
  });

  describe('remove', () => {
    it('deletes an existing suministro without medidores', async () => {
      // Create a suministro without medidores to avoid FK constraint
      const newSuministro = await prisma.suministro.create({
        data: {
          codigoSuministro: 'SUM-DELETE-TEST',
          tipoCliente: TipoCliente.RESIDENCIAL,
          zonaId: testData.zone.id,
        },
      });

      await service.remove(newSuministro.id);

      const found = await prisma.suministro.findUnique({
        where: { id: newSuministro.id },
      });
      expect(found).toBeNull();
    });

    it('throws NotFoundException for non-existent id', async () => {
      await expect(service.remove(99999)).rejects.toThrow('Suministro no encontrado');
    });
  });
});
