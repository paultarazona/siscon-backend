import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildPaginatedResponse, PaginatedResult } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { IncidenciaFilterDto } from './dto/incidencia-filter.dto';

@Injectable()
export class IncidenciasService {
  constructor(
    private prisma: PrismaService,
    private readonly integrationsService: IntegrationsService,
  ) {}

  async findAll(q: IncidenciaFilterDto): Promise<PaginatedResult> {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;

    const where: Prisma.IncidenciaWhereInput = {
      tipoIncidencia: q.tipoIncidencia,
      estado: q.estado,
      nivel: q.nivel,
    };

    // Build nested where clause for lectura relation
    const lecturaWhere: Prisma.LecturaWhereInput = {};

    if (q.anio || q.mes) {
      lecturaWhere.periodo = { anio: q.anio, mes: q.mes };
    }

    if (q.zonaId) {
      lecturaWhere.medidor = { suministro: { zonaId: q.zonaId } };
    }

    if (Object.keys(lecturaWhere).length > 0) {
      where.lectura = lecturaWhere;
    }

    const orderByField = this.resolveSortField(q.sortBy);
    const orderByDir = q.order === 'asc' ? 'asc' : 'desc';

    const [data, total] = await this.prisma.$transaction([
      this.prisma.incidencia.findMany({
        where,
        include: { lectura: { include: { periodo: true, medidor: true } } },
        orderBy: { [orderByField]: orderByDir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.incidencia.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  private resolveSortField(sortBy?: string): string {
    const allowed: Record<string, string> = {
      fechaDeteccion: 'fechaDeteccion',
      id: 'id',
    };
    return allowed[sortBy ?? ''] ?? 'fechaDeteccion';
  }

  async resolver(id: number) {
    const exists = await this.prisma.incidencia.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Incidencia no encontrada');
    return this.prisma.incidencia.update({ where: { id }, data: { estado: 'RESUELTA' } });
  }

  async deriveToSigom(id: number) {
    return this.integrationsService.deriveToSigom(id);
  }
}
