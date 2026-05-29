import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';
import { ReporteFilterDto } from './dto/reporte-filter.dto';

@Injectable()
export class ReportesService {
  constructor(private prisma: PrismaService) {}

  private buildWhere(q: ReporteFilterDto): Prisma.Sql {
    const conditions: Prisma.Sql[] = [];

    if (q.anioDesde) conditions.push(Prisma.sql`p.anio >= ${q.anioDesde}`);
    if (q.anioHasta) conditions.push(Prisma.sql`p.anio <= ${q.anioHasta}`);
    if (q.mes) conditions.push(Prisma.sql`p.mes = ${q.mes}`);
    if (q.zonaId) conditions.push(Prisma.sql`s."zonaId" = ${q.zonaId}`);
    if (q.distrito) conditions.push(Prisma.sql`z.distrito = ${q.distrito}`);
    if (q.tipoCliente) conditions.push(Prisma.sql`s."tipoCliente" = ${q.tipoCliente}`);
    if (q.estadoLectura) conditions.push(Prisma.sql`l."estadoLectura" = ${q.estadoLectura}`);

    return conditions.length ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}` : Prisma.empty;
  }

  async lecturasCsv(q: ReporteFilterDto) {
    const where = this.buildWhere(q);
    const rows = await this.prisma.$queryRaw`
      SELECT
        l.id, p.anio, p.mes, m."numeroMedidor", s."codigoSuministro",
        l."lecturaAnterior", l."lecturaActual", l."consumoKwh",
        l."estadoLectura", z."nombreZona", z.distrito, s."tipoCliente"
      FROM "Lectura" l
      JOIN "Periodo" p ON p.id = l."periodoId"
      JOIN "Medidor" m ON m.id = l."medidorId"
      JOIN "Suministro" s ON s.id = m."suministroId"
      JOIN "ZonaOperativa" z ON z.id = s."zonaId"
      ${where}
      ORDER BY p.anio, p.mes, l.id
    ` as Array<Record<string, any>>;

    const header = 'id,anio,mes,numeroMedidor,codigoSuministro,zona,distrito,tipoCliente,lecturaAnterior,lecturaActual,consumoKwh,estadoLectura\n';
    return header + rows.map((r) =>
      [r.id, r.anio, r.mes, r.numeroMedidor, r.codigoSuministro, r.nombreZona, r.distrito, r.tipoCliente, r.lecturaAnterior, r.lecturaActual, r.consumoKwh, r.estadoLectura].join(','),
    ).join('\n');
  }

  async consumoExcel(q: ReporteFilterDto) {
    const where = this.buildWhere(q);
    const rows = await this.prisma.$queryRaw`
      SELECT
        p.anio, p.mes,
        COUNT(l.id)::int AS lecturas,
        COALESCE(SUM(l."consumoKwh"), 0) AS "consumoKwh"
      FROM "Lectura" l
      JOIN "Periodo" p ON p.id = l."periodoId"
      JOIN "Medidor" m ON m.id = l."medidorId"
      JOIN "Suministro" s ON s.id = m."suministroId"
      JOIN "ZonaOperativa" z ON z.id = s."zonaId"
      ${where}
      GROUP BY p.anio, p.mes
      ORDER BY p.anio, p.mes
    ` as Array<Record<string, any>>;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Consumo');
    ws.columns = [
      { header: 'Año', key: 'anio' },
      { header: 'Mes', key: 'mes' },
      { header: 'Lecturas', key: 'lecturas' },
      { header: 'Consumo kWh', key: 'consumo' },
    ];
    rows.forEach((r) => ws.addRow({ anio: r.anio, mes: r.mes, lecturas: r.lecturas, consumo: String(r.consumoKwh) }));
    return wb.xlsx.writeBuffer();
  }
}
