import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { PrismaModule } from '../src/prisma/prisma.module';

/**
 * Integration test helper: creates a testing module with real DB connection.
 * Uses enosa_test database.
 */
export async function createTestingModule(
  providers: any[] = [],
  imports: any[] = [],
): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [PrismaModule, ...imports],
    providers: [...providers],
  }).compile();
}

/**
 * Creates and initializes a NestJS application for integration testing.
 */
export async function createTestApp(module: TestingModule): Promise<INestApplication> {
  const app = module.createNestApplication();
  await app.init();
  return app;
}

/**
 * Clean all data using a single TRUNCATE with CASCADE.
 * This bypasses FK constraints and resets all identity sequences.
 * Must be a single statement — PostgreSQL doesn't allow multiple TRUNCATEs in prepared statements.
 */
export async function cleanDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE 
      "Incidencia", "Lectura", "ImportacionDataset", "Medidor", 
      "Suministro", "Periodo", "ZonaOperativa", "Usuario"
    RESTART IDENTITY CASCADE
  `);
}

/**
 * Seed minimal test data for integration tests.
 */
export async function seedTestData(prisma: PrismaService) {
  // Create a test user
  const user = await prisma.usuario.create({
    data: {
      nombres: 'Test',
      apellidos: 'User',
      email: 'test@siscon-enosa.local',
      passwordHash: '$2a$10$dummy',
      rol: 'OPERADOR',
    },
  });

  // Create a test zone
  const zone = await prisma.zonaOperativa.create({
    data: {
      departamento: 'Piura',
      provincia: 'Piura',
      distrito: 'Piura',
      nombreZona: 'Piura Centro',
      codigoZona: 'Z-TEST-001',
    },
  });

  // Create a test suministro
  const suministro = await prisma.suministro.create({
    data: {
      codigoSuministro: 'SUM-TEST-001',
      tipoCliente: 'RESIDENCIAL',
      zonaId: zone.id,
    },
  });

  // Create a test medidor
  const medidor = await prisma.medidor.create({
    data: {
      numeroMedidor: 'M-TEST-001',
      suministroId: suministro.id,
      marca: 'TestBrand',
    },
  });

  // Create test periods
  const periodo1 = await prisma.periodo.create({
    data: {
      anio: 2024,
      mes: 7,
      fechaInicio: new Date('2024-07-01'),
      fechaFin: new Date('2024-07-31'),
    },
  });

  const periodo2 = await prisma.periodo.create({
    data: {
      anio: 2024,
      mes: 8,
      fechaInicio: new Date('2024-08-01'),
      fechaFin: new Date('2024-08-31'),
    },
  });

  return { user, zone, suministro, medidor, periodo1, periodo2 };
}
