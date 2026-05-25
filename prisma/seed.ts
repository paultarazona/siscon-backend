import { EstadoGeneral, PrismaClient, Role, TipoCliente } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const tipos = [TipoCliente.RESIDENCIAL, TipoCliente.COMERCIAL, TipoCliente.INDUSTRIAL, TipoCliente.PUBLICO];

const coberturaTerritorial = [
  {
    departamento: 'Piura',
    codigoDepartamento: 'PIU',
    provincias: [
      { nombre: 'Piura', codigo: 'PIU', distritos: ['Piura', 'Castilla', 'Catacaos', 'Cura Mori', 'El Tallán', 'La Arena', 'La Unión', 'Las Lomas', 'Tambogrande', 'Veintiséis de Octubre'] },
      { nombre: 'Ayabaca', codigo: 'AYA', distritos: ['Ayabaca', 'Frías', 'Jililí', 'Lagunas', 'Montero', 'Pacaipampa', 'Paimas', 'Sapillica', 'Sícchez', 'Suyo'] },
      { nombre: 'Huancabamba', codigo: 'HUA', distritos: ['Huancabamba', 'Canchaque', 'El Carmen de la Frontera', 'Huarmaca', 'Lalaquiz', 'San Miguel de El Faique', 'Sóndor', 'Sondorillo'] },
      { nombre: 'Morropón', codigo: 'MOR', distritos: ['Chulucanas', 'Buenos Aires', 'Chalaco', 'La Matanza', 'Morropón', 'Salitral', 'San Juan de Bigote', 'Santa Catalina de Mossa', 'Santo Domingo', 'Yamango'] },
      { nombre: 'Paita', codigo: 'PAI', distritos: ['Paita', 'Amotape', 'Arenal', 'Colán', 'La Huaca', 'Tamarindo', 'Vichayal'] },
      { nombre: 'Sullana', codigo: 'SUL', distritos: ['Sullana', 'Bellavista', 'Ignacio Escudero', 'Lancones', 'Marcavelica', 'Miguel Checa', 'Querecotillo', 'Salitral'] },
      { nombre: 'Talara', codigo: 'TAL', distritos: ['Pariñas', 'El Alto', 'La Brea', 'Lobitos', 'Los Órganos', 'Máncora'] },
      { nombre: 'Sechura', codigo: 'SEC', distritos: ['Sechura', 'Bellavista de la Unión', 'Bernal', 'Cristo Nos Valga', 'Vice', 'Rinconada Llicuar'] },
    ],
  },
  {
    departamento: 'Tumbes',
    codigoDepartamento: 'TUM',
    provincias: [
      { nombre: 'Tumbes', codigo: 'TUM', distritos: ['Tumbes', 'Corrales', 'La Cruz', 'Pampas de Hospital', 'San Jacinto', 'San Juan de la Virgen'] },
      { nombre: 'Contralmirante Villar', codigo: 'CON', distritos: ['Zorritos', 'Casitas', 'Canoas de Punta Sal'] },
      { nombre: 'Zarumilla', codigo: 'ZAR', distritos: ['Zarumilla', 'Aguas Verdes', 'Matapalo', 'Papayal'] },
    ],
  },
];

const zonasTerritoriales = coberturaTerritorial.flatMap((departamento) =>
  departamento.provincias.flatMap((provincia) =>
    provincia.distritos.map((distrito, index) => ({
      departamento: departamento.departamento,
      provincia: provincia.nombre,
      distrito,
      nombreZona: `${distrito} - ${provincia.nombre}`,
      codigoZona: `ZON-${departamento.codigoDepartamento}-${provincia.codigo}-${String(index + 1).padStart(3, '0')}`,
      estado: EstadoGeneral.ACTIVO,
    })),
  ),
);

const legacyZonaCodes: Record<string, string> = {
  'PIU-CEN': 'ZON-PIU-PIU-001',
  'SUL-NOR': 'ZON-PIU-SUL-001',
  'TAL-OPE': 'ZON-PIU-TAL-001',
  'TUM-CEN': 'ZON-TUM-TUM-001',
  'ZAR-FRO': 'ZON-TUM-ZAR-001',
};

async function migrateLegacyZonaCodes() {
  for (const [legacyCode, newCode] of Object.entries(legacyZonaCodes)) {
    const legacy = await prisma.zonaOperativa.findUnique({ where: { codigoZona: legacyCode } });
    if (!legacy) continue;

    const target = await prisma.zonaOperativa.findUnique({ where: { codigoZona: newCode } });
    if (target) {
      await prisma.suministro.updateMany({ where: { zonaId: legacy.id }, data: { zonaId: target.id } });
      await prisma.zonaOperativa.delete({ where: { id: legacy.id } });
      continue;
    }

    const data = zonasTerritoriales.find((zona) => zona.codigoZona === newCode);
    if (!data) continue;

    await prisma.zonaOperativa.update({ where: { id: legacy.id }, data });
  }
}

async function ensurePeriodos(anios: number[]) {
  for (const anio of anios) {
    for (let mes = 1; mes <= 12; mes++) {
      await prisma.periodo.upsert({
        where: { anio_mes: { anio, mes } },
        update: {},
        create: {
          anio,
          mes,
          fechaInicio: new Date(anio, mes - 1, 1),
          fechaFin: new Date(anio, mes, 0),
        },
      });
    }
  }
}

async function main() {
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@siscon-enosa.local' },
    update: {},
    create: { nombres: 'Admin', apellidos: 'SISCON', email: 'admin@siscon-enosa.local', passwordHash: await bcrypt.hash('admin123', 10), rol: Role.ADMIN },
  });

  await migrateLegacyZonaCodes();
  for (const zona of zonasTerritoriales) {
    await prisma.zonaOperativa.upsert({
      where: { codigoZona: zona.codigoZona },
      update: {
        departamento: zona.departamento,
        provincia: zona.provincia,
        distrito: zona.distrito,
        nombreZona: zona.nombreZona,
        estado: zona.estado,
      },
      create: zona,
    });
  }
  const zonas = await prisma.zonaOperativa.findMany({ orderBy: { id: 'asc' } });

  for (let i = 1; i <= 100; i++) {
    const suministro = await prisma.suministro.upsert({
      where: { codigoSuministro: `SUM-${String(i).padStart(5, '0')}` },
      update: {},
      create: { codigoSuministro: `SUM-${String(i).padStart(5, '0')}`, tipoCliente: tipos[i % tipos.length], direccionReferencial: `Referencia operativa ${i}`, zonaId: zonas[i % zonas.length].id },
    });
    await prisma.medidor.upsert({ where: { numeroMedidor: `MED-${String(i).padStart(6, '0')}` }, update: {}, create: { numeroMedidor: `MED-${String(i).padStart(6, '0')}`, suministroId: suministro.id, marca: 'ENOSA', modelo: `M-${(i % 5) + 1}`, fechaInstalacion: new Date(2019, i % 12, 1) } });
  }

  await ensurePeriodos([2020, 2021, 2022, 2023, 2024, 2026]);

  const medidores = await prisma.medidor.findMany({ orderBy: { id: 'asc' } });
  const periodos = await prisma.periodo.findMany({ where: { anio: { lte: 2024 } }, orderBy: [{ anio: 'asc' }, { mes: 'asc' }] });
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
