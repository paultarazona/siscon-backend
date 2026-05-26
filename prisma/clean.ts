import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Este script no puede ejecutarse en producción.');
    process.exit(1);
  }

  console.log('🧹 Limpiando datos de la base de datos...');

  await prisma.$transaction([
    prisma.incidencia.deleteMany(),
    prisma.lectura.deleteMany(),
    prisma.importacionDataset.deleteMany(),
    prisma.medidor.deleteMany(),
    prisma.suministro.deleteMany(),
    prisma.periodo.deleteMany(),
    prisma.zonaOperativa.deleteMany(),
    prisma.usuario.deleteMany(),
  ]);

  console.log('✅ Datos eliminados correctamente.');
  console.log('ℹ️  No se modificó la estructura de la base de datos.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
