import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Este script no puede ejecutarse en producción.');
    process.exit(1);
  }

  console.log('⚠️  ATENCIÓN: Este script reiniciará los IDs autoincrementales.');
  console.log('🧹 Limpiando datos y reiniciando secuencias...');

  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "Incidencia",
      "Lectura",
      "ImportacionDataset",
      "Medidor",
      "Suministro",
      "Periodo",
      "ZonaOperativa",
      "Usuario"
    RESTART IDENTITY CASCADE;
  `);

  console.log('✅ Datos eliminados y secuencias reiniciadas correctamente.');
  console.log('ℹ️  No se modificó la estructura de la base de datos.');
  console.log('⚠️  Los IDs comenzarán desde 1 en el próximo seed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
