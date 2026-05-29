import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { buildPaginatedResponse, PaginatedResult } from '../common/dto/pagination.dto';
import { LecturasService } from '../lecturas/lecturas.service';
import { PrismaService } from '../prisma/prisma.service';
import { ImportacionFilterDto } from './dto/importacion-filter.dto';

@Injectable()
export class ImportacionesService {
  constructor(private prisma: PrismaService, private lecturas: LecturasService) {}

  async findAll(q: ImportacionFilterDto): Promise<PaginatedResult> {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;

    const where: Prisma.ImportacionDatasetWhereInput = {
      estado: q.estado,
      importadoPorId: q.importadoPorId,
    };

    const orderByField = this.resolveSortField(q.sortBy);
    const orderByDir = q.order === 'asc' ? 'asc' : 'desc';

    const [data, total] = await this.prisma.$transaction([
      this.prisma.importacionDataset.findMany({
        where,
        include: { importadoPor: { select: { id: true, nombres: true, apellidos: true, email: true } } },
        orderBy: { [orderByField]: orderByDir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.importacionDataset.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  private resolveSortField(sortBy?: string): string {
    const allowed: Record<string, string> = {
      fechaImportacion: 'fechaImportacion',
      id: 'id',
    };
    return allowed[sortBy ?? ''] ?? 'fechaImportacion';
  }
  async importarCsv(file: Express.Multer.File, userId: number) {
    if (!file) throw new BadRequestException('Debe enviar un archivo CSV en el campo file');
    const rows = parse(file.buffer.toString('utf8'), { columns: true, skip_empty_lines: true, trim: true }) as Record<string,string>[];
    let validos = 0, errores = 0;
    for (const row of rows) {
      try {
        const numeroMedidor = row.numero_medidor ?? row.numeroMedidor;
        const lecturaAnterior = row.lectura_anterior ?? row.lecturaAnterior;
        const lecturaActual = row.lectura_actual ?? row.lecturaActual;
        const fechaLectura = row.fecha_lectura ?? row.fechaLectura;
        const medidor = await this.prisma.medidor.findUnique({ where: { numeroMedidor } });
        const periodo = await this.prisma.periodo.findUnique({ where: { anio_mes: { anio: Number(row.anio), mes: Number(row.mes) } } });
        if (!medidor || !periodo) throw new Error('Medidor o periodo no encontrado');
        await this.lecturas.create({ medidorId: medidor.id, periodoId: periodo.id, lecturaAnterior: Number(lecturaAnterior), lecturaActual: Number(lecturaActual), fechaLectura: fechaLectura ? new Date(fechaLectura) : new Date(), observacion: row.observacion }, userId);
        validos++;
      } catch { errores++; }
    }
    return this.prisma.importacionDataset.create({ data: { nombreArchivo: file.originalname, totalRegistros: rows.length, registrosValidos: validos, registrosError: errores, importadoPorId: userId, estado: errores ? 'PROCESADO_CON_ERRORES' : 'PROCESADO' } });
  }
}
