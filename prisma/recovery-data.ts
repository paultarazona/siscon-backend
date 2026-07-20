import {
  EstadoGeneral,
  EstadoIncidencia,
  EstadoLectura,
  EstadoMedidor,
  PrismaClient,
  Role,
  TipoCliente,
  TipoIncidencia,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
export const RECOVERY_SUPPLIES = 1000;
export const READINGS_PER_METER = 48;

type RecoveryPeriod = {
  anio: number;
  mes: number;
  fechaInicio: Date;
  fechaFin: Date;
};

export function buildRecoveryPeriods(): RecoveryPeriod[] {
  const periods: RecoveryPeriod[] = [];
  for (let anio = 2022; anio <= 2025; anio++) {
    for (let mes = 1; mes <= 12; mes++) {
      periods.push({
        anio,
        mes,
        fechaInicio: new Date(Date.UTC(anio, mes - 1, 1)),
        fechaFin: new Date(Date.UTC(anio, mes, 0)),
      });
    }
  }
  return periods;
}

function code(prefix: string, index: number, width = 5) {
  return `${prefix}-${String(index).padStart(width, '0')}`;
}

async function main() {
  // Repair the rows left by integration tests so presentation tables stay complete.
  await prisma.suministro.updateMany({
    where: { codigoSuministro: 'SUM-TEST-001', direccionReferencial: null },
    data: { direccionReferencial: 'Av. Prueba 100, Piura' },
  });
  await prisma.medidor.updateMany({
    where: { numeroMedidor: 'M-TEST-001' },
    data: { marca: 'TestBrand', modelo: 'TST-100', fechaInstalacion: new Date(Date.UTC(2021, 0, 15)) },
  });
  await prisma.medidor.updateMany({
    where: { numeroMedidor: 'M-TEST-002' },
    data: { marca: 'Itron', modelo: 'TST-200', fechaInstalacion: new Date(Date.UTC(2022, 1, 15)) },
  });

  const passwordHash = await bcrypt.hash('Recovery2025!', 10);
  const users = [
    { email: 'recovery.admin@siscon.local', nombres: 'Administrador', apellidos: 'Recuperación', rol: Role.ADMIN },
    { email: 'recovery.operador1@siscon.local', nombres: 'Rosa', apellidos: 'Operaciones', rol: Role.OPERADOR },
    { email: 'recovery.operador2@siscon.local', nombres: 'Miguel', apellidos: 'Lecturas', rol: Role.OPERADOR },
    { email: 'recovery.analista@siscon.local', nombres: 'Elena', apellidos: 'Análisis', rol: Role.ANALISTA },
    ...Array.from({ length: 12 }, (_, index) => ({
      email: `recovery.operador${index + 3}@siscon.local`,
      nombres: `Operador ${index + 3}`,
      apellidos: 'Recuperación',
      rol: Role.OPERADOR,
    })),
    ...Array.from({ length: 4 }, (_, index) => ({
      email: `recovery.analista${index + 2}@siscon.local`,
      nombres: `Analista ${index + 2}`,
      apellidos: 'Recuperación',
      rol: Role.ANALISTA,
    })),
  ];

  for (const user of users) {
    await prisma.usuario.upsert({
      where: { email: user.email },
      update: {},
      create: { ...user, passwordHash, estado: EstadoGeneral.ACTIVO },
    });
  }

  const operators = await prisma.usuario.findMany({
    where: { email: { startsWith: 'recovery.operador' } },
    orderBy: { id: 'asc' },
  });

  const zones = Array.from({ length: 20 }, (_, index) => ({
    codigoZona: code('REC-ZON', index + 1, 3),
    departamento: index < 15 ? 'Piura' : 'Tumbes',
    provincia: ['Piura', 'Sullana', 'Talara', 'Paita', 'Tumbes'][index % 5],
    distrito: `Sector Operativo ${index + 1}`,
    nombreZona: `Zona de Recuperación ${index + 1}`,
    estado: EstadoGeneral.ACTIVO,
  }));
  await prisma.zonaOperativa.createMany({ data: zones, skipDuplicates: true });
  const persistedZones = await prisma.zonaOperativa.findMany({
    where: { codigoZona: { startsWith: 'REC-ZON-' } },
    orderBy: { codigoZona: 'asc' },
  });

  const periods = buildRecoveryPeriods();
  for (const period of periods) {
    await prisma.periodo.upsert({
      where: { anio_mes: { anio: period.anio, mes: period.mes } },
      update: {},
      create: { ...period, estado: EstadoGeneral.ACTIVO },
    });
  }
  const persistedPeriods = await prisma.periodo.findMany({
    where: { anio: { gte: 2022, lte: 2025 } },
    orderBy: [{ anio: 'asc' }, { mes: 'asc' }],
  });

  const clientTypes = [TipoCliente.RESIDENCIAL, TipoCliente.COMERCIAL, TipoCliente.INDUSTRIAL, TipoCliente.PUBLICO];
  await prisma.suministro.createMany({
    data: Array.from({ length: RECOVERY_SUPPLIES }, (_, index) => ({
      codigoSuministro: code('REC-SUM', index + 1),
      tipoCliente: clientTypes[index % clientTypes.length],
      direccionReferencial: `Av. Recuperación ${index + 1}`,
      zonaId: persistedZones[index % persistedZones.length].id,
      estado: index % 25 === 0 ? EstadoGeneral.INACTIVO : EstadoGeneral.ACTIVO,
      fechaAlta: new Date(Date.UTC(2019 + (index % 3), index % 12, (index % 27) + 1)),
    })),
    skipDuplicates: true,
  });
  const supplies = await prisma.suministro.findMany({
    where: { codigoSuministro: { startsWith: 'REC-SUM-' } },
    orderBy: { codigoSuministro: 'asc' },
  });

  await prisma.medidor.createMany({
    data: supplies.map((supply, index) => ({
      numeroMedidor: code('REC-MED', index + 1),
      suministroId: supply.id,
      marca: ['Hexing', 'Itron', 'Elster', 'Landis+Gyr'][index % 4],
      modelo: ['HXE12', 'A100C', 'E650', 'ACE6000'][index % 4],
      fechaInstalacion: new Date(Date.UTC(2020 + (index % 2), index % 12, (index % 27) + 1)),
      estado: index % 30 === 0 ? EstadoMedidor.EN_REVISION : EstadoMedidor.ACTIVO,
    })),
    skipDuplicates: true,
  });
  const meters = await prisma.medidor.findMany({
    where: { numeroMedidor: { startsWith: 'REC-MED-' } },
    orderBy: { numeroMedidor: 'asc' },
  });

  const readings = meters.flatMap((meter, meterIndex) => {
    const selectedPeriods = Array.from({ length: READINGS_PER_METER }, (_, readingIndex) => {
      const periodIndex = (meterIndex * 7 + readingIndex * 13) % persistedPeriods.length;
      return persistedPeriods[periodIndex];
    }).sort((a, b) => a.anio - b.anio || a.mes - b.mes);

    let accumulated = 500 + meterIndex * 17;
    return selectedPeriods.map((period, readingIndex) => {
      const consumption = 90 + ((meterIndex * 31 + readingIndex * 19) % 850);
      const previous = accumulated;
      accumulated += consumption;
      return {
        medidorId: meter.id,
        periodoId: period.id,
        lecturaAnterior: previous,
        lecturaActual: accumulated,
        consumoKwh: consumption,
        fechaLectura: new Date(Date.UTC(period.anio, period.mes - 1, 10 + (readingIndex % 15))),
        estadoLectura: readingIndex % 29 === 0 ? EstadoLectura.OBSERVADA : EstadoLectura.VALIDA,
        observacion: readingIndex % 29 === 0 ? 'Lectura observada para verificación operativa.' : 'Lectura registrada correctamente.',
        registradoPorId: operators[meterIndex % operators.length].id,
        fechaRegistro: new Date(Date.UTC(period.anio, period.mes - 1, 11 + (readingIndex % 15))),
      };
    });
  });
  await prisma.lectura.createMany({ data: readings, skipDuplicates: true });

  const persistedReadings = await prisma.lectura.findMany({
    where: { medidorId: { in: meters.map((meter) => meter.id) } },
    orderBy: { id: 'asc' },
  });
  const existingIncidentReadings = new Set((await prisma.incidencia.findMany({
    where: { lecturaId: { in: persistedReadings.map((reading) => reading.id) } },
    select: { lecturaId: true },
  })).map((incident) => incident.lecturaId));
  const incidentTypes = [TipoIncidencia.CONSUMO_ALTO, TipoIncidencia.CONSUMO_BAJO, TipoIncidencia.LECTURA_INVALIDA, TipoIncidencia.MEDIDOR_OBSERVADO];
  await prisma.incidencia.createMany({
    data: persistedReadings
      .filter((reading) => reading.id % 20 === 0 && !existingIncidentReadings.has(reading.id))
      .map((reading, index) => ({
        lecturaId: reading.id,
        tipoIncidencia: incidentTypes[index % incidentTypes.length],
        descripcion: 'Incidencia sintética de recuperación para análisis operativo.',
        nivel: index % 7 === 0 ? 'ALTO' : 'MEDIO',
        estado: index % 3 === 0 ? EstadoIncidencia.RESUELTA : EstadoIncidencia.PENDIENTE,
        fechaDeteccion: reading.fechaRegistro,
      })),
    skipDuplicates: true,
  });

  const existingImports = new Set((await prisma.importacionDataset.findMany({
    where: { nombreArchivo: { startsWith: 'recovery-' } },
    select: { nombreArchivo: true },
  })).map((entry) => entry.nombreArchivo));
  await prisma.importacionDataset.createMany({
    data: [2022, 2023, 2024, 2025]
      .filter((year) => !existingImports.has(`recovery-${year}.csv`))
      .map((year, index) => ({
        nombreArchivo: `recovery-${year}.csv`,
        totalRegistros: 1250,
        registrosValidos: 1250,
        registrosError: 0,
        fechaImportacion: new Date(Date.UTC(year, 11, 31)),
        importadoPorId: operators[index % operators.length].id,
        estado: 'COMPLETADO',
      })),
  });

  const [userCount, zoneCount, supplyCount, meterCount, periodCount, readingCount, incidentCount, importCount] = await Promise.all([
    prisma.usuario.count(),
    prisma.zonaOperativa.count(),
    prisma.suministro.count(),
    prisma.medidor.count(),
    prisma.periodo.count(),
    prisma.lectura.count(),
    prisma.incidencia.count(),
    prisma.importacionDataset.count(),
  ]);
  console.log({ userCount, zoneCount, supplyCount, meterCount, periodCount, readingCount, incidentCount, importCount });
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
