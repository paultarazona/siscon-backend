import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private lecturaWhere(q: DashboardFilterDto): Prisma.Sql {
    const anioDesde = q.anioDesde ?? q.anio;
    const anioHasta = q.anioHasta ?? q.anio;
    const conditions: Prisma.Sql[] = [];

    if (anioDesde) conditions.push(Prisma.sql`p.anio >= ${anioDesde}`);
    if (anioHasta) conditions.push(Prisma.sql`p.anio <= ${anioHasta}`);
    if (q.mes) conditions.push(Prisma.sql`p.mes = ${q.mes}`);
    if (q.zonaId) conditions.push(Prisma.sql`s."zonaId" = ${q.zonaId}`);
    if (q.distrito) conditions.push(Prisma.sql`z.distrito = ${q.distrito}`);
    if (q.tipoCliente) conditions.push(Prisma.sql`s."tipoCliente" = ${q.tipoCliente}`);
    if (q.estadoLectura) conditions.push(Prisma.sql`l."estadoLectura" = ${q.estadoLectura}`);

    return conditions.length ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}` : Prisma.empty;
  }

  private incidenciaWhere(q: DashboardFilterDto): Prisma.Sql {
    const anioDesde = q.anioDesde ?? q.anio;
    const anioHasta = q.anioHasta ?? q.anio;
    const conditions: Prisma.Sql[] = [];

    if (anioDesde) conditions.push(Prisma.sql`p.anio >= ${anioDesde}`);
    if (anioHasta) conditions.push(Prisma.sql`p.anio <= ${anioHasta}`);
    if (q.mes) conditions.push(Prisma.sql`p.mes = ${q.mes}`);
    if (q.zonaId) conditions.push(Prisma.sql`s."zonaId" = ${q.zonaId}`);
    if (q.distrito) conditions.push(Prisma.sql`z.distrito = ${q.distrito}`);
    if (q.tipoCliente) conditions.push(Prisma.sql`s."tipoCliente" = ${q.tipoCliente}`);
    if (q.estadoLectura) conditions.push(Prisma.sql`l."estadoLectura" = ${q.estadoLectura}`);
    if (q.tipoIncidencia) conditions.push(Prisma.sql`i."tipoIncidencia" = ${q.tipoIncidencia}`);

    return conditions.length ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}` : Prisma.empty;
  }

  async resumen(q: DashboardFilterDto) {
    const where = this.lecturaWhere(q);
    const incidenciaWhere = this.incidenciaWhere(q);
    const [lecturas, consumo, incidencias, medidoresActivos] = await Promise.all([
      this.prisma.$queryRaw`SELECT COUNT(*)::int AS total FROM "Lectura" l JOIN "Periodo" p ON p.id=l."periodoId" JOIN "Medidor" m ON m.id=l."medidorId" JOIN "Suministro" s ON s.id=m."suministroId" JOIN "ZonaOperativa" z ON z.id=s."zonaId" ${where}`,
      this.prisma.$queryRaw`SELECT COALESCE(SUM(l."consumoKwh"), 0) AS total FROM "Lectura" l JOIN "Periodo" p ON p.id=l."periodoId" JOIN "Medidor" m ON m.id=l."medidorId" JOIN "Suministro" s ON s.id=m."suministroId" JOIN "ZonaOperativa" z ON z.id=s."zonaId" ${where}`,
      this.prisma.$queryRaw`SELECT COUNT(*)::int AS total FROM "Incidencia" i JOIN "Lectura" l ON l.id=i."lecturaId" JOIN "Periodo" p ON p.id=l."periodoId" JOIN "Medidor" m ON m.id=l."medidorId" JOIN "Suministro" s ON s.id=m."suministroId" JOIN "ZonaOperativa" z ON z.id=s."zonaId" ${incidenciaWhere}`,
      this.prisma.medidor.count({ where: { estado: 'ACTIVO' } }),
    ]);

    return {
      totalLecturas: Number((lecturas as Array<{ total: number }>)[0]?.total ?? 0),
      consumoTotalKwh: (consumo as Array<{ total: Prisma.Decimal }>)[0]?.total ?? 0,
      totalIncidencias: Number((incidencias as Array<{ total: number }>)[0]?.total ?? 0),
      medidoresActivos,
    };
  }

  consumoMensual(q: DashboardFilterDto) { return this.prisma.$queryRaw`SELECT p.anio, p.mes, SUM(l."consumoKwh") AS "consumoKwh" FROM "Lectura" l JOIN "Periodo" p ON p.id=l."periodoId" JOIN "Medidor" m ON m.id=l."medidorId" JOIN "Suministro" s ON s.id=m."suministroId" JOIN "ZonaOperativa" z ON z.id=s."zonaId" ${this.lecturaWhere(q)} GROUP BY p.anio,p.mes ORDER BY p.anio,p.mes`; }
  comparativoAnual(q: DashboardFilterDto) { return this.prisma.$queryRaw`SELECT p.anio, SUM(l."consumoKwh") AS "consumoKwh" FROM "Lectura" l JOIN "Periodo" p ON p.id=l."periodoId" JOIN "Medidor" m ON m.id=l."medidorId" JOIN "Suministro" s ON s.id=m."suministroId" JOIN "ZonaOperativa" z ON z.id=s."zonaId" ${this.lecturaWhere(q)} GROUP BY p.anio ORDER BY p.anio`; }
  consumoPorZona(q: DashboardFilterDto) { return this.prisma.$queryRaw`SELECT z."nombreZona", z."codigoZona", SUM(l."consumoKwh") AS "consumoKwh" FROM "Lectura" l JOIN "Periodo" p ON p.id=l."periodoId" JOIN "Medidor" m ON m.id=l."medidorId" JOIN "Suministro" s ON s.id=m."suministroId" JOIN "ZonaOperativa" z ON z.id=s."zonaId" ${this.lecturaWhere(q)} GROUP BY z.id ORDER BY "consumoKwh" DESC`; }
  consumoPorTipoCliente(q: DashboardFilterDto) { return this.prisma.$queryRaw`SELECT s."tipoCliente", SUM(l."consumoKwh") AS "consumoKwh" FROM "Lectura" l JOIN "Periodo" p ON p.id=l."periodoId" JOIN "Medidor" m ON m.id=l."medidorId" JOIN "Suministro" s ON s.id=m."suministroId" JOIN "ZonaOperativa" z ON z.id=s."zonaId" ${this.lecturaWhere(q)} GROUP BY s."tipoCliente" ORDER BY "consumoKwh" DESC`; }
  incidenciasPorTipo(q: DashboardFilterDto) { return this.prisma.$queryRaw`SELECT i."tipoIncidencia", i.estado, COUNT(*)::int AS total FROM "Incidencia" i JOIN "Lectura" l ON l.id=i."lecturaId" JOIN "Periodo" p ON p.id=l."periodoId" JOIN "Medidor" m ON m.id=l."medidorId" JOIN "Suministro" s ON s.id=m."suministroId" JOIN "ZonaOperativa" z ON z.id=s."zonaId" ${this.incidenciaWhere(q)} GROUP BY i."tipoIncidencia", i.estado ORDER BY total DESC`; }
  topSuministros(q: DashboardFilterDto) { return this.prisma.$queryRaw`SELECT s."codigoSuministro", z."nombreZona", SUM(l."consumoKwh") AS "consumoKwh" FROM "Lectura" l JOIN "Periodo" p ON p.id=l."periodoId" JOIN "Medidor" m ON m.id=l."medidorId" JOIN "Suministro" s ON s.id=m."suministroId" JOIN "ZonaOperativa" z ON z.id=s."zonaId" ${this.lecturaWhere(q)} GROUP BY s.id,z."nombreZona" ORDER BY "consumoKwh" DESC LIMIT 10`; }
}
