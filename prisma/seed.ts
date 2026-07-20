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

const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });

/* ================================================================
   1. GENERADOR PSEUDOALEATORIO DETERMINÍSTICO (LCG)
   ================================================================ */
class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed >>> 0;
  }
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 0.999999));
  }
  choice<T>(arr: T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }
}

const rng = new SeededRandom(20262026);

/* ================================================================
   2. CONSTANTES DE TERRITORIO
   ================================================================ */
const coberturaTerritorial = [
  {
    departamento: 'Piura',
    provincias: [
      { nombre: 'Piura', distritos: ['Piura', 'Castilla', 'Catacaos', 'Cura Mori', 'El Tallán', 'La Arena', 'La Unión', 'Las Lomas', 'Tambogrande', 'Veintiséis de Octubre'] },
      { nombre: 'Ayabaca', distritos: ['Ayabaca', 'Frías', 'Jililí', 'Lagunas', 'Montero', 'Pacaipampa', 'Paimas', 'Sapillica', 'Sícchez', 'Suyo'] },
      { nombre: 'Huancabamba', distritos: ['Huancabamba', 'Canchaque', 'El Carmen de la Frontera', 'Huarmaca', 'Lalaquiz', 'San Miguel de El Faique', 'Sóndor', 'Sondorillo'] },
      { nombre: 'Morropón', distritos: ['Chulucanas', 'Buenos Aires', 'Chalaco', 'La Matanza', 'Morropón', 'Salitral', 'San Juan de Bigote', 'Santa Catalina de Mossa', 'Santo Domingo', 'Yamango'] },
      { nombre: 'Paita', distritos: ['Paita', 'Amotape', 'Arenal', 'Colán', 'La Huaca', 'Tamarindo', 'Vichayal'] },
      { nombre: 'Sullana', distritos: ['Sullana', 'Bellavista', 'Ignacio Escudero', 'Lancones', 'Marcavelica', 'Miguel Checa', 'Querecotillo', 'Salitral'] },
      { nombre: 'Talara', distritos: ['Pariñas', 'El Alto', 'La Brea', 'Lobitos', 'Los Órganos', 'Máncora'] },
      { nombre: 'Sechura', distritos: ['Sechura', 'Bellavista de la Unión', 'Bernal', 'Cristo Nos Valga', 'Vice', 'Rinconada Llicuar'] },
    ],
  },
  {
    departamento: 'Tumbes',
    provincias: [
      { nombre: 'Tumbes', distritos: ['Tumbes', 'Corrales', 'La Cruz', 'Pampas de Hospital', 'San Jacinto', 'San Juan de la Virgen'] },
      { nombre: 'Contralmirante Villar', distritos: ['Zorritos', 'Casitas', 'Canoas de Punta Sal'] },
      { nombre: 'Zarumilla', distritos: ['Zarumilla', 'Aguas Verdes', 'Matapalo', 'Papayal'] },
    ],
  },
];

const zonasData = coberturaTerritorial.flatMap((dep) =>
  dep.provincias.flatMap((prov) =>
    prov.distritos.map((distrito) => ({
      departamento: dep.departamento,
      provincia: prov.nombre,
      distrito,
      nombreZona: `${distrito} - ${prov.nombre}`,
      codigoZona: `ZON-${dep.departamento.substring(0, 3).toUpperCase()}-${prov.nombre.substring(0, 3).toUpperCase()}-${distrito.substring(0, 3).toUpperCase()}`,
      estado: EstadoGeneral.ACTIVO,
    })),
  ),
);

/* ================================================================
   3. CONSTANTES DE NEGOCIO
   ================================================================ */
const TOTAL_SUMINISTROS = 1000;
const PERIODO_DESDE = { anio: 2024, mes: 1 };
const PERIODO_HASTA = { anio: 2026, mes: 12 };
const MARCAS = ['Hexing', 'Landis+Gyr', 'Elster', 'Itron', 'Schneider'];
const MODELOS = ['HXE12', 'E650', 'A100C', 'ACE6000', 'PM500'];
const CALLES = ['Av. Grau', 'Jr. Lima', 'Calle Comercio', 'Urb. Los Algarrobos', 'Caserío San Martín', 'Sector Centro', 'Av. Panamericana Norte', 'Calle Principal', 'AA.HH. Nuevo Amanecer', 'Av. Sánchez Cerro', 'Jr. Huancavelica', 'Urb. Santa Rosa', 'Calle Libertad'];
const DISTRITOS_COSTEROS = new Set([
  'Máncora', 'Los Órganos', 'Zorritos', 'Canoas de Punta Sal', 'Paita', 'Colán', 'Tamarindo', 'Vichayal', 'Tumbes', 'Zarumilla', 'Aguas Verdes', 'Pariñas', 'Sechura', 'Bellavista de la Unión',
]);
const PROVINCIAS_ALTA_CONCENTRACION = new Set(['Piura', 'Sullana', 'Talara', 'Tumbes']);
const PROVINCIAS_BAJA_CONCENTRACION = new Set(['Ayabaca', 'Huancabamba']);

/* ================================================================
   4. HELPERS
   ================================================================ */
function codigoSuministro(i: number) {
  return `SUM-${String(i).padStart(5, '0')}`;
}
function codigoMedidor(i: number) {
  return `MED-${String(i).padStart(5, '0')}`;
}
function formatDateYMD(d: Date) {
  return d.toISOString().split('T')[0];
}

/* ================================================================
   5. PERFIL DE CONSUMO BASE POR TIPO CLIENTE
   ================================================================ */
function perfilBaseKwh(tipo: TipoCliente): { min: number; max: number } {
  switch (tipo) {
    case TipoCliente.RESIDENCIAL:
      return { min: 40, max: 450 };
    case TipoCliente.COMERCIAL:
      return { min: 250, max: 3500 };
    case TipoCliente.INDUSTRIAL:
      return { min: 3000, max: 50000 };
    case TipoCliente.PUBLICO:
      return { min: 300, max: 6000 };
  }
}

/* ================================================================
   6. FACTORES DE VARIACIÓN
   ================================================================ */
function factorEstacionalidad(mes: number, esCostero: boolean, tipo: TipoCliente): number {
  let factor = 1.0;
  // Verano: enero-marzo
  if (mes >= 1 && mes <= 3) {
    factor += rng.range(0.15, 0.35);
    if (esCostero && (tipo === TipoCliente.COMERCIAL || tipo === TipoCliente.PUBLICO)) {
      factor += rng.range(0.10, 0.25);
    }
  }
  // Menor consumo: julio-agosto
  if (mes === 7 || mes === 8) {
    factor -= rng.range(0.05, 0.12);
  }
  return factor;
}

function factorCrecimientoAnual(anio: number): number {
  if (anio === 2024) return 1.0;
  if (anio === 2025) return 1.06;
  return 1.12;
}

function variacionAleatoria(tipo: TipoCliente): number {
  const pct =
    tipo === TipoCliente.RESIDENCIAL ? 0.15 :
    tipo === TipoCliente.COMERCIAL ? 0.20 :
    tipo === TipoCliente.INDUSTRIAL ? 0.12 : 0.10;
  return 1.0 + rng.range(-pct, pct);
}

/* ================================================================
   7. MAIN SEED
   ================================================================ */
async function main() {
  console.log('🌱 Iniciando seed completo SISCON-ENOSA...');
  const t0 = Date.now();

  /* ---------- 7.1 USUARIOS ---------- */
  console.log('👤 Creando usuarios...');
  const usuariosData = [
    { nombres: 'Administrador', apellidos: 'ENOSA', email: 'admin@enosa.test', passwordHash: await bcrypt.hash('Admin123456', 10), rol: Role.ADMIN },
    { nombres: 'Ana', apellidos: 'Operaciones', email: 'ana.operaciones@enosa.test', passwordHash: await bcrypt.hash('Test123456', 10), rol: Role.ANALISTA },
    { nombres: 'Luis', apellidos: 'Reportes', email: 'luis.reportes@enosa.test', passwordHash: await bcrypt.hash('Test123456', 10), rol: Role.ANALISTA },
    { nombres: 'Carlos', apellidos: 'Piura', email: 'operador.piura@enosa.test', passwordHash: await bcrypt.hash('Test123456', 10), rol: Role.OPERADOR },
    { nombres: 'María', apellidos: 'Sullana', email: 'operador.sullana@enosa.test', passwordHash: await bcrypt.hash('Test123456', 10), rol: Role.OPERADOR },
    { nombres: 'Jorge', apellidos: 'Talara', email: 'operador.talara@enosa.test', passwordHash: await bcrypt.hash('Test123456', 10), rol: Role.OPERADOR },
    { nombres: 'Diana', apellidos: 'Tumbes', email: 'operador.tumbes@enosa.test', passwordHash: await bcrypt.hash('Test123456', 10), rol: Role.OPERADOR },
  ];

  for (const u of usuariosData) {
    await prisma.usuario.upsert({ where: { email: u.email }, update: {}, create: u });
  }
  const usuarios = await prisma.usuario.findMany({ orderBy: { id: 'asc' } });
  const adminId = usuarios.find((u) => u.rol === Role.ADMIN)!.id;
  const operadores = usuarios.filter((u) => u.rol === Role.OPERADOR);
  console.log(`   ✅ ${usuarios.length} usuarios creados`);

  /* ---------- 7.2 ZONAS OPERATIVAS ---------- */
  console.log('🗺️  Creando zonas operativas...');
  for (const z of zonasData) {
    await prisma.zonaOperativa.upsert({
      where: { codigoZona: z.codigoZona },
      update: {},
      create: z,
    });
  }
  const zonas = await prisma.zonaOperativa.findMany({ orderBy: { id: 'asc' } });
  console.log(`   ✅ ${zonas.length} zonas creadas`);

  /* ---------- 7.3 PERIODOS 2024-2026 ---------- */
  console.log('📅 Creando periodos 2024-2026...');
  const periodosBatch: { anio: number; mes: number; fechaInicio: Date; fechaFin: Date; estado: EstadoGeneral }[] = [];
  for (let anio = PERIODO_DESDE.anio; anio <= PERIODO_HASTA.anio; anio++) {
    for (let mes = 1; mes <= 12; mes++) {
      periodosBatch.push({
        anio,
        mes,
        fechaInicio: new Date(anio, mes - 1, 1),
        fechaFin: new Date(anio, mes, 0),
        estado: EstadoGeneral.ACTIVO,
      });
    }
  }
  for (const p of periodosBatch) {
    await prisma.periodo.upsert({
      where: { anio_mes: { anio: p.anio, mes: p.mes } },
      update: {},
      create: p,
    });
  }
  const periodos = await prisma.periodo.findMany({ orderBy: [{ anio: 'asc' }, { mes: 'asc' }] });
  console.log(`   ✅ ${periodos.length} periodos creados`);

  /* ---------- 7.4 ASIGNAR ZONAS A OPERADORES ---------- */
  const operadorPorZona = new Map<number, number>();
  for (const z of zonas) {
    let opId: number;
    if (z.provincia === 'Piura' || z.provincia === 'Ayabaca') opId = operadores[0].id; // piura
    else if (z.provincia === 'Sullana' || z.provincia === 'Paita' || z.provincia === 'Morropón') opId = operadores[1].id; // sullana
    else if (z.provincia === 'Talara' || z.provincia === 'Sechura') opId = operadores[2].id; // talara
    else if (z.departamento === 'Tumbes') opId = operadores[3].id; // tumbes
    else if (z.provincia === 'Huancabamba') opId = operadores[0].id;
    else opId = operadores[rng.int(0, operadores.length - 1)].id;
    operadorPorZona.set(z.id, opId);
  }

  /* ---------- 7.5 SUMINISTROS ---------- */
  console.log('⚡ Creando 1000 suministros...');
  const tiposDistribucion: TipoCliente[] = [
    ...Array(700).fill(TipoCliente.RESIDENCIAL),
    ...Array(200).fill(TipoCliente.COMERCIAL),
    ...Array(50).fill(TipoCliente.INDUSTRIAL),
    ...Array(50).fill(TipoCliente.PUBLICO),
  ];

  // Shuffle determinístico
  for (let i = tiposDistribucion.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [tiposDistribucion[i], tiposDistribucion[j]] = [tiposDistribucion[j], tiposDistribucion[i]];
  }

  const suministrosBatch = [];
  for (let i = 1; i <= TOTAL_SUMINISTROS; i++) {
    const tipo = tiposDistribucion[i - 1];
    const esActivo = rng.next() < 0.95;
    const estado = esActivo ? EstadoGeneral.ACTIVO : EstadoGeneral.INACTIVO;

    // Distribución territorial ponderada
    let zonaIdx: number;
    let intentos = 0;
    do {
      zonaIdx = rng.int(0, zonas.length - 1);
      const prov = zonas[zonaIdx].provincia;
      const dist = zonas[zonaIdx].distrito;
      const esAlta = PROVINCIAS_ALTA_CONCENTRACION.has(prov);
      const esBaja = PROVINCIAS_BAJA_CONCENTRACION.has(prov);
      const peso = esAlta ? 0.45 : esBaja ? 0.05 : 0.25;
      if (rng.next() < peso || intentos > 50) break;
      intentos++;
    } while (true);

    const calle = rng.choice(CALLES);
    const numero = rng.int(1, 999);
    const ref = `${calle} ${numero}`;

    suministrosBatch.push({
      codigoSuministro: codigoSuministro(i),
      tipoCliente: tipo,
      direccionReferencial: ref,
      zonaId: zonas[zonaIdx].id,
      estado,
      fechaAlta: new Date(rng.int(2018, 2023), rng.int(0, 11), rng.int(1, 28)),
    });
  }

  await prisma.suministro.createMany({ data: suministrosBatch, skipDuplicates: true });
  const suministros = await prisma.suministro.findMany({ orderBy: { id: 'asc' } });
  console.log(`   ✅ ${suministros.length} suministros creados`);

  /* ---------- 7.6 PERFILES DE CONSUMO POR SUMINISTRO ---------- */
  const perfilPorSuministro = new Map<number, number>();
  for (const s of suministros) {
    const rango = perfilBaseKwh(s.tipoCliente);
    perfilPorSuministro.set(s.id, rng.range(rango.min, rango.max));
  }

  /* ---------- 7.7 MEDIDORES ---------- */
  console.log('📟 Creando medidores...');
  const medidoresBatch = [];
  let medidorCounter = 1;
  for (const s of suministros) {
    const nMed = codigoMedidor(medidorCounter++);
    const estado = s.estado === EstadoGeneral.INACTIVO && rng.next() < 0.5 ? EstadoMedidor.RETIRADO : EstadoMedidor.ACTIVO;
    medidoresBatch.push({
      numeroMedidor: nMed,
      suministroId: s.id,
      marca: rng.choice(MARCAS),
      modelo: rng.choice(MODELOS),
      fechaInstalacion: new Date(rng.int(2018, 2023), rng.int(0, 11), rng.int(1, 28)),
      estado,
    });

    // 5% de suministros con segundo medidor (retirado + activo)
    if (rng.next() < 0.05 && s.estado === EstadoGeneral.ACTIVO) {
      medidoresBatch.push({
        numeroMedidor: codigoMedidor(medidorCounter++),
        suministroId: s.id,
        marca: rng.choice(MARCAS),
        modelo: rng.choice(MODELOS),
        fechaInstalacion: new Date(rng.int(2019, 2024), rng.int(0, 11), rng.int(1, 28)),
        estado: EstadoMedidor.RETIRADO,
      });
    }
  }

  await prisma.medidor.createMany({ data: medidoresBatch, skipDuplicates: true });
  const medidores = await prisma.medidor.findMany({ orderBy: { id: 'asc' } });
  const medidoresActivos = medidores.filter((m) => m.estado === EstadoMedidor.ACTIVO);
  console.log(`   ✅ ${medidores.length} medidores creados (${medidoresActivos.length} activos)`);

  /* ---------- 7.8 LECTURAS ---------- */
  console.log('📊 Generando lecturas 2024-2026...');
  const lecturasBatch: {
    medidorId: number;
    periodoId: number;
    lecturaAnterior: number;
    lecturaActual: number;
    consumoKwh: number;
    fechaLectura: Date;
    estadoLectura: EstadoLectura;
    observacion: string;
    registradoPorId: number;
    fechaRegistro: Date;
  }[] = [];

  const incidenciasBatch: {
    lecturaId: number;
    tipoIncidencia: TipoIncidencia;
    descripcion: string;
    nivel: string;
    estado: EstadoIncidencia;
    fechaDeteccion: Date;
  }[] = [];

  let lecturasCreadas = 0;
  let incidenciasCreadas = 0;

  // Mapa de lectura acumulada por medidor
  const lecturaAcumulada = new Map<number, number>();
  for (const m of medidoresActivos) {
    lecturaAcumulada.set(m.id, rng.int(500, 15000));
  }

  for (const periodo of periodos) {
    const mes = periodo.mes;
    const anio = periodo.anio;
    const factorAnual = factorCrecimientoAnual(anio);

    for (const medidor of medidoresActivos) {
      const suministro = suministros.find((s) => s.id === medidor.suministroId);
      if (!suministro) continue;

      const perfilBase = perfilPorSuministro.get(suministro.id) ?? 200;
      const zona = zonas.find((z) => z.id === suministro.zonaId);
      const esCostero = zona ? DISTRITOS_COSTEROS.has(zona.distrito) : false;
      const tipo = suministro.tipoCliente;

      const factor = factorEstacionalidad(mes, esCostero, tipo) * factorAnual * variacionAleatoria(tipo);
      const consumo = Math.max(0, Math.round(perfilBase * factor));

      const anterior = lecturaAcumulada.get(medidor.id) ?? 0;
      const actual = anterior + consumo;
      lecturaAcumulada.set(medidor.id, actual);

      // Estado de lectura
      let estadoLectura: EstadoLectura;
      const r = rng.next();
      if (r < 0.90) estadoLectura = EstadoLectura.VALIDA;
      else if (r < 0.97) estadoLectura = EstadoLectura.OBSERVADA;
      else if (r < 0.99) estadoLectura = EstadoLectura.CORREGIDA;
      else estadoLectura = EstadoLectura.ANULADA;

      // Observación
      let observacion = '-';
      if (estadoLectura === EstadoLectura.OBSERVADA) observacion = rng.choice(['Consumo superior al promedio histórico', 'Consumo inferior al promedio histórico', 'Medidor requiere verificación']);
      if (estadoLectura === EstadoLectura.CORREGIDA) observacion = 'Lectura corregida por error de digitación';
      if (estadoLectura === EstadoLectura.ANULADA) observacion = 'Lectura anulada por inconsistencia';

      const diaLectura = rng.int(5, 25);
      const fechaLectura = new Date(anio, mes - 1, diaLectura);
      const operadorId = zona ? operadorPorZona.get(zona.id) ?? adminId : adminId;

      const lectura = {
        medidorId: medidor.id,
        periodoId: periodo.id,
        lecturaAnterior: anterior,
        lecturaActual: actual,
        consumoKwh: consumo,
        fechaLectura,
        estadoLectura,
        observacion,
        registradoPorId: operadorId,
        fechaRegistro: new Date(anio, mes - 1, Math.min(diaLectura + rng.int(0, 2), 28)),
      };

      lecturasBatch.push(lectura);
      lecturasCreadas++;

      // Incidencias
      const umbralAlto = perfilBase * 2.5;
      const umbralBajo = perfilBase * 0.25;
      let crearIncidencia = false;
      let tipoInc: TipoIncidencia = TipoIncidencia.CONSUMO_ALTO;
      let nivelInc = 'MEDIO';
      let descInc = '';

      if (consumo > umbralAlto) {
        crearIncidencia = true;
        tipoInc = TipoIncidencia.CONSUMO_ALTO;
        nivelInc = consumo > umbralAlto * 2 ? 'CRITICO' : 'ALTO';
        descInc = `Consumo anormalmente alto: ${consumo} kWh (perfil base ${Math.round(perfilBase)})`;
      } else if (consumo < umbralBajo && consumo > 0) {
        crearIncidencia = true;
        tipoInc = TipoIncidencia.CONSUMO_BAJO;
        nivelInc = 'MEDIO';
        descInc = `Consumo anormalmente bajo: ${consumo} kWh (perfil base ${Math.round(perfilBase)})`;
      } else if (consumo === 0) {
        crearIncidencia = true;
        tipoInc = TipoIncidencia.SIN_LECTURA;
        nivelInc = 'ALTO';
        descInc = 'No se registró consumo en el periodo';
      } else if (medidor.estado === EstadoMedidor.EN_REVISION) {
        crearIncidencia = true;
        tipoInc = TipoIncidencia.MEDIDOR_OBSERVADO;
        nivelInc = 'MEDIO';
        descInc = 'Medidor marcado para revisión técnica';
      }

      // Solo algunas lecturas anómalas generan incidencia
      if (crearIncidencia && rng.next() < 0.6) {
        // Necesitamos el ID de la lectura, pero aún no existe. 
        // Usaremos un placeholder y luego mapearemos, o mejor: insertar lecturas primero y luego generar incidencias.
        // Simplificación: guardaremos los índices y generaremos incidencias en segunda pasada.
      }
    }

    // Insertar batch cada 2000 lecturas para no saturar memoria
    if (lecturasBatch.length >= 2000) {
      await prisma.lectura.createMany({ data: lecturasBatch });
      lecturasBatch.length = 0;
    }
  }

  if (lecturasBatch.length > 0) {
    await prisma.lectura.createMany({ data: lecturasBatch });
    lecturasBatch.length = 0;
  }

  console.log(`   ✅ ${lecturasCreadas} lecturas creadas`);

  /* ---------- 7.9 INCIDENCIAS (segunda pasada) ---------- */
  console.log('🚨 Generando incidencias...');
  const lecturasConIncidencia = await prisma.lectura.findMany({
    where: {
      OR: [
        { consumoKwh: { gt: 0 } }, // placeholder: filtraremos en memoria
      ],
    },
    select: { id: true, medidorId: true, periodoId: true, consumoKwh: true, estadoLectura: true },
  });

  // Obtener todos los datos necesarios para calcular incidencias
  const medidorMap = new Map(medidores.map((m) => [m.id, m]));
  const suministroMap = new Map(suministros.map((s) => [s.id, s]));
  const lecturasParaIncidencias = await prisma.lectura.findMany({
    include: { medidor: true },
    orderBy: [{ medidorId: 'asc' }, { periodoId: 'asc' }],
  });

  for (const lect of lecturasParaIncidencias) {
    const sum = suministroMap.get(lect.medidor.suministroId);
    if (!sum) continue;
    const perfilBase = perfilPorSuministro.get(sum.id) ?? 200;
    const consumo = Number(lect.consumoKwh);
    const umbralAlto = perfilBase * 2.5;
    const umbralBajo = perfilBase * 0.25;

      let tipoInc: TipoIncidencia | null = null;
      let nivelInc = 'MEDIO';
      let descInc = '';

      // Forzar anomalías sintéticas para el MVP académico
      const anomaliaForced = rng.next();
      if (anomaliaForced < 0.015) {
        // 1.5% consumo muy alto
        tipoInc = TipoIncidencia.CONSUMO_ALTO;
        nivelInc = 'ALTO';
        descInc = `Consumo anormalmente alto: ${consumo} kWh (perfil base ${Math.round(perfilBase)})`;
      } else if (anomaliaForced < 0.030) {
        // 1.5% consumo muy bajo
        tipoInc = TipoIncidencia.CONSUMO_BAJO;
        descInc = `Consumo anormalmente bajo: ${consumo} kWh (perfil base ${Math.round(perfilBase)})`;
      } else if (anomaliaForced < 0.040) {
        // 1.0% sin lectura
        tipoInc = TipoIncidencia.SIN_LECTURA;
        nivelInc = 'ALTO';
        descInc = 'No se registró consumo en el periodo';
      } else if (anomaliaForced < 0.050) {
        // 1.0% lectura inválida
        tipoInc = TipoIncidencia.LECTURA_INVALIDA;
        descInc = 'Lectura fuera de rango esperado para el periodo';
      } else if (lect.medidor.estado === EstadoMedidor.EN_REVISION) {
        tipoInc = TipoIncidencia.MEDIDOR_OBSERVADO;
        descInc = 'Medidor marcado para revisión técnica';
      } else if (consumo > umbralAlto) {
        tipoInc = TipoIncidencia.CONSUMO_ALTO;
        nivelInc = consumo > umbralAlto * 2 ? 'CRITICO' : 'ALTO';
        descInc = `Consumo anormalmente alto: ${consumo} kWh (perfil base ${Math.round(perfilBase)})`;
      } else if (consumo < umbralBajo && consumo > 0) {
        tipoInc = TipoIncidencia.CONSUMO_BAJO;
        descInc = `Consumo anormalmente bajo: ${consumo} kWh (perfil base ${Math.round(perfilBase)})`;
      }

      if (tipoInc && rng.next() < 0.80) {
      const estadosInc = [
        EstadoIncidencia.PENDIENTE,
        EstadoIncidencia.DERIVADA_A_SIGOM,
        EstadoIncidencia.RESUELTA,
      ];
      const probs = [0.40, 0.30, 0.30];
      const r2 = rng.next();
      const estadoInc = r2 < probs[0] ? estadosInc[0] : r2 < probs[0] + probs[1] ? estadosInc[1] : estadosInc[2];

      incidenciasBatch.push({
        lecturaId: lect.id,
        tipoIncidencia: tipoInc,
        descripcion: descInc,
        nivel: nivelInc,
        estado: estadoInc,
        fechaDeteccion: lect.fechaRegistro ?? new Date(),
      });
      incidenciasCreadas++;

      if (incidenciasBatch.length >= 1000) {
        await prisma.incidencia.createMany({ data: incidenciasBatch });
        incidenciasBatch.length = 0;
      }
    }
  }

  if (incidenciasBatch.length > 0) {
    await prisma.incidencia.createMany({ data: incidenciasBatch });
  }

  console.log(`   ✅ ${incidenciasCreadas} incidencias creadas`);

  const t1 = Date.now();
  console.log(`\n🎉 Seed finalizado en ${((t1 - t0) / 1000).toFixed(1)}s`);
  console.log('Resumen:');
  console.log(`  • Usuarios:      ${usuarios.length}`);
  console.log(`  • Zonas:         ${zonas.length}`);
  console.log(`  • Periodos:      ${periodos.length}`);
  console.log(`  • Suministros:   ${suministros.length}`);
  console.log(`  • Medidores:     ${medidores.length}`);
  console.log(`  • Lecturas:      ${lecturasCreadas}`);
  console.log(`  • Incidencias:   ${incidenciasCreadas}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
