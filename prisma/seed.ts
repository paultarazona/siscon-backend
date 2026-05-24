import { PrismaClient, Role, TipoCliente } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const tipos = [TipoCliente.RESIDENCIAL, TipoCliente.COMERCIAL, TipoCliente.INDUSTRIAL, TipoCliente.PUBLICO];

async function main() {
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@siscon-enosa.local' },
    update: {},
    create: { nombres: 'Admin', apellidos: 'SISCON', email: 'admin@siscon-enosa.local', passwordHash: await bcrypt.hash('admin123', 10), rol: Role.ADMIN },
  });

  const zonasData = [
    ['Piura', 'Piura', 'Piura', 'Piura Centro', 'PIU-CEN'], ['Piura', 'Sullana', 'Sullana', 'Sullana Norte', 'SUL-NOR'], ['Piura', 'Talara', 'Pariñas', 'Talara Operativa', 'TAL-OPE'], ['Tumbes', 'Tumbes', 'Tumbes', 'Tumbes Centro', 'TUM-CEN'], ['Tumbes', 'Zarumilla', 'Zarumilla', 'Zarumilla Frontera', 'ZAR-FRO'],
  ];
  for (const z of zonasData) await prisma.zonaOperativa.upsert({ where: { codigoZona: z[4] }, update: {}, create: { departamento: z[0], provincia: z[1], distrito: z[2], nombreZona: z[3], codigoZona: z[4] } });
  const zonas = await prisma.zonaOperativa.findMany({ orderBy: { id: 'asc' } });

  for (let i = 1; i <= 100; i++) {
    const suministro = await prisma.suministro.upsert({
      where: { codigoSuministro: `SUM-${String(i).padStart(5, '0')}` },
      update: {},
      create: { codigoSuministro: `SUM-${String(i).padStart(5, '0')}`, tipoCliente: tipos[i % tipos.length], direccionReferencial: `Referencia operativa ${i}`, zonaId: zonas[i % zonas.length].id },
    });
    await prisma.medidor.upsert({ where: { numeroMedidor: `MED-${String(i).padStart(6, '0')}` }, update: {}, create: { numeroMedidor: `MED-${String(i).padStart(6, '0')}`, suministroId: suministro.id, marca: 'ENOSA', modelo: `M-${(i % 5) + 1}`, fechaInstalacion: new Date(2019, i % 12, 1) } });
  }

  for (let anio = 2020; anio <= 2024; anio++) for (let mes = 1; mes <= 12; mes++) await prisma.periodo.upsert({ where: { anio_mes: { anio, mes } }, update: {}, create: { anio, mes, fechaInicio: new Date(anio, mes - 1, 1), fechaFin: new Date(anio, mes, 0) } });

  const medidores = await prisma.medidor.findMany({ orderBy: { id: 'asc' } });
  const periodos = await prisma.periodo.findMany({ orderBy: [{ anio: 'asc' }, { mes: 'asc' }] });
  for (const medidor of medidores) {
    let lecturaAnterior = 500 + medidor.id * 10;
    for (const periodo of periodos) {
      const base = tipos[medidor.id % tipos.length] === TipoCliente.INDUSTRIAL ? 900 : tipos[medidor.id % tipos.length] === TipoCliente.COMERCIAL ? 350 : 120;
      const consumo = base + ((medidor.id * periodo.mes) % 80) + (periodo.anio - 2020) * 6;
      const lecturaActual = lecturaAnterior + consumo;
      await prisma.lectura.upsert({
        where: { medidorId_periodoId: { medidorId: medidor.id, periodoId: periodo.id } },
        update: {},
        create: { medidorId: medidor.id, periodoId: periodo.id, lecturaAnterior, lecturaActual, consumoKwh: consumo, fechaLectura: new Date(periodo.anio, periodo.mes - 1, 20), registradoPorId: admin.id },
      });
      lecturaAnterior = lecturaActual;
    }
  }
}

main().finally(async () => prisma.$disconnect());
