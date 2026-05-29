import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EstadoLectura, EstadoMedidor } from '@prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';
import { LecturasService } from '../src/lecturas/application/lecturas.service';
import { LecturasModule } from '../src/lecturas/lecturas.module';
import { cleanDatabase, seedTestData } from './integration-helpers';

describe('LecturasService (Integration)', () => {
  let app: INestApplication;
  let service: LecturasService;
  let prisma: PrismaService;
  let testData: Awaited<ReturnType<typeof seedTestData>>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [LecturasModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    service = moduleFixture.get<LecturasService>(LecturasService);
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
    testData = await seedTestData(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('create', () => {
    it('creates a valid lectura and returns it with calculated consumption', async () => {
      const result = await service.create(
        {
          medidorId: testData.medidor.id,
          periodoId: testData.periodo1.id,
          lecturaAnterior: 100,
          lecturaActual: 250,
          fechaLectura: new Date(),
        },
        testData.user.id,
      );

      expect(result).toBeDefined();
      expect(result!.id).toBeDefined();
      expect(Number(result!.lecturaAnterior)).toBe(100);
      expect(Number(result!.lecturaActual)).toBe(250);
      expect(Number(result!.consumoKwh)).toBe(150);
      expect(result!.estadoLectura).toBe(EstadoLectura.VALIDA);
    });

    it('creates an automatic incidencia when consumption is high', async () => {
      const result = await service.create(
        {
          medidorId: testData.medidor.id,
          periodoId: testData.periodo1.id,
          lecturaAnterior: 0,
          lecturaActual: 1500,
          fechaLectura: new Date(),
        },
        testData.user.id,
      );

      const incidencias = await prisma.incidencia.findMany({
        where: { lecturaId: result!.id },
      });

      expect(incidencias).toHaveLength(1);
      expect(incidencias[0].tipoIncidencia).toBe('CONSUMO_ALTO');
    });

    it('rejects duplicate lectura for same medidor and periodo', async () => {
      await service.create(
        {
          medidorId: testData.medidor.id,
          periodoId: testData.periodo1.id,
          lecturaAnterior: 100,
          lecturaActual: 200,
          fechaLectura: new Date(),
        },
        testData.user.id,
      );

      await expect(
        service.create(
          {
            medidorId: testData.medidor.id,
            periodoId: testData.periodo1.id,
            lecturaAnterior: 200,
            lecturaActual: 300,
            fechaLectura: new Date(),
          },
          testData.user.id,
        ),
      ).rejects.toThrow('Ya existe lectura del medidor para el periodo');
    });

    it('rejects lectura when medidor is not ACTIVO', async () => {
      await prisma.medidor.update({
        where: { id: testData.medidor.id },
        data: { estado: EstadoMedidor.RETIRADO },
      });

      await expect(
        service.create(
          {
            medidorId: testData.medidor.id,
            periodoId: testData.periodo1.id,
            lecturaAnterior: 100,
            lecturaActual: 200,
            fechaLectura: new Date(),
          },
          testData.user.id,
        ),
      ).rejects.toThrow('El medidor debe estar ACTIVO para registrar lectura');
    });

    it('rejects regressive lectura', async () => {
      await expect(
        service.create(
          {
            medidorId: testData.medidor.id,
            periodoId: testData.periodo1.id,
            lecturaAnterior: 200,
            lecturaActual: 100,
            fechaLectura: new Date(),
          },
          testData.user.id,
        ),
      ).rejects.toThrow('lectura_actual no puede ser menor que lectura_anterior');
    });
  });

  describe('findAll', () => {
    it('returns paginated lecturas with metadata', async () => {
      // Create 3 lecturas: 2 for periodo1 (different medidores), 1 for periodo2
      // First, create a second medidor to avoid duplicate constraint
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

      await service.create(
        {
          medidorId: testData.medidor.id,
          periodoId: testData.periodo1.id,
          lecturaAnterior: 100,
          lecturaActual: 200,
          fechaLectura: new Date(),
        },
        testData.user.id,
      );
      await service.create(
        {
          medidorId: medidor2.id,
          periodoId: testData.periodo1.id,
          lecturaAnterior: 50,
          lecturaActual: 150,
          fechaLectura: new Date(),
        },
        testData.user.id,
      );
      await service.create(
        {
          medidorId: testData.medidor.id,
          periodoId: testData.periodo2.id,
          lecturaAnterior: 200,
          lecturaActual: 400,
          fechaLectura: new Date(),
        },
        testData.user.id,
      );

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(3);
      expect(result.meta.total).toBe(3);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.hasNextPage).toBe(false);
    });

    it('filters by anio and mes', async () => {
      await service.create(
        {
          medidorId: testData.medidor.id,
          periodoId: testData.periodo1.id,
          lecturaAnterior: 100,
          lecturaActual: 200,
          fechaLectura: new Date(),
        },
        testData.user.id,
      );

      await service.create(
        {
          medidorId: testData.medidor.id,
          periodoId: testData.periodo2.id,
          lecturaAnterior: 200,
          lecturaActual: 300,
          fechaLectura: new Date(),
        },
        testData.user.id,
      );

      const result = await service.findAll({ anio: 2024, mes: 7 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('filters by zonaId through medidor relationship', async () => {
      await service.create(
        {
          medidorId: testData.medidor.id,
          periodoId: testData.periodo1.id,
          lecturaAnterior: 100,
          lecturaActual: 200,
          fechaLectura: new Date(),
        },
        testData.user.id,
      );

      const result = await service.findAll({ zonaId: testData.zone.id });

      expect(result.data).toHaveLength(1);
    });

    it('returns empty page when no data matches filters', async () => {
      const result = await service.findAll({ anio: 2099, mes: 12 });

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('returns a lectura by id', async () => {
      const created = await service.create(
        {
          medidorId: testData.medidor.id,
          periodoId: testData.periodo1.id,
          lecturaAnterior: 100,
          lecturaActual: 200,
          fechaLectura: new Date(),
        },
        testData.user.id,
      );

      const found = await service.findOne(created!.id);

      expect(found.id).toBe(created!.id);
      expect(Number(found.lecturaAnterior)).toBe(100);
    });

    it('throws NotFoundException for non-existent id', async () => {
      await expect(service.findOne(99999)).rejects.toThrow('Lectura no encontrada');
    });
  });

  describe('prepararRegistro', () => {
    it('returns preparation data with last lectura and suggested period', async () => {
      await service.create(
        {
          medidorId: testData.medidor.id,
          periodoId: testData.periodo1.id,
          lecturaAnterior: 100,
          lecturaActual: 250,
          fechaLectura: new Date(),
        },
        testData.user.id,
      );

      const result = await service.prepararRegistro(testData.medidor.id);

      expect(result.medidor.id).toBe(testData.medidor.id);
      expect(result.medidor.estado).toBe(EstadoMedidor.ACTIVO);
      expect(result.ultimaLectura).not.toBeNull();
      expect(result.ultimaLectura!.lecturaActual).toBe(250);
      expect(result.ultimaLectura!.periodo).toBe('2024-07');
      expect(result.periodoSugerido).toEqual({ anio: 2024, mes: 8 });
    });

    it('returns null ultimaLectura when no previous lecturas exist', async () => {
      const result = await service.prepararRegistro(testData.medidor.id);

      expect(result.ultimaLectura).toBeNull();
      expect(result.periodoSugerido).toBeNull();
    });
  });

  describe('update', () => {
    it('updates a lectura and recalculates consumption', async () => {
      const created = await service.create(
        {
          medidorId: testData.medidor.id,
          periodoId: testData.periodo1.id,
          lecturaAnterior: 100,
          lecturaActual: 200,
          fechaLectura: new Date(),
        },
        testData.user.id,
      );

      const updated = await service.update(created!.id, {
        lecturaAnterior: 100,
        lecturaActual: 350,
      });

      expect(Number(updated.consumoKwh)).toBe(250);
      expect(updated.estadoLectura).toBe(EstadoLectura.CORREGIDA);
    });

    it('rejects regressive update', async () => {
      const created = await service.create(
        {
          medidorId: testData.medidor.id,
          periodoId: testData.periodo1.id,
          lecturaAnterior: 100,
          lecturaActual: 200,
          fechaLectura: new Date(),
        },
        testData.user.id,
      );

      await expect(
        service.update(created!.id, { lecturaAnterior: 300, lecturaActual: 200 }),
      ).rejects.toThrow('lectura_actual no puede ser menor que lectura_anterior');
    });
  });

  describe('remove', () => {
    it('deletes a lectura and its associated incidencias', async () => {
      const created = await service.create(
        {
          medidorId: testData.medidor.id,
          periodoId: testData.periodo1.id,
          lecturaAnterior: 0,
          lecturaActual: 1500, // triggers incidencia
          fechaLectura: new Date(),
        },
        testData.user.id,
      );

      const incidenciasBefore = await prisma.incidencia.count({
        where: { lecturaId: created!.id },
      });
      expect(incidenciasBefore).toBe(1);

      await service.remove(created!.id);

      const lecturaAfter = await prisma.lectura.findUnique({ where: { id: created!.id } });
      const incidenciasAfter = await prisma.incidencia.count({
        where: { lecturaId: created!.id },
      });

      expect(lecturaAfter).toBeNull();
      expect(incidenciasAfter).toBe(0);
    });
  });
});
