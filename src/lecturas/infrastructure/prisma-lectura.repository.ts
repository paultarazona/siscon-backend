import { Injectable } from '@nestjs/common';
import { EstadoLectura, Prisma } from '@prisma/client';
import { buildPaginatedResponse } from '../../common/dto/pagination.dto';
import { toDecimal } from '../../common/utils/decimal';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLecturaDto } from '../dto/create-lectura.dto';
import { LecturaFilterDto } from '../dto/lectura-filter.dto';
import { UpdateLecturaDto } from '../dto/update-lectura.dto';
import { IncidenciaAutomatica } from '../domain/lectura.rules';
import { LecturaConDetalle, LecturaRepository, PaginatedLecturas } from '../domain/lectura.repository';

@Injectable()
export class PrismaLecturaRepository implements LecturaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(q: LecturaFilterDto): Promise<PaginatedLecturas> {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;

    const where: Prisma.LecturaWhereInput = {
      periodo: { anio: q.anio, mes: q.mes },
      medidorId: q.medidorId,
      estadoLectura: q.estadoLectura,
      medidor: {
        suministroId: q.suministroId,
        suministro: { zonaId: q.zonaId, tipoCliente: q.tipoCliente, zona: { distrito: q.distrito } },
      },
    };

    // Text search across medidor number, suministro code, zona name, and observacion
    if (q.search) {
      where.OR = [
        { medidor: { numeroMedidor: { contains: q.search, mode: 'insensitive' } } },
        { medidor: { suministro: { codigoSuministro: { contains: q.search, mode: 'insensitive' } } } },
        { medidor: { suministro: { zona: { nombreZona: { contains: q.search, mode: 'insensitive' } } } } },
        { observacion: { contains: q.search, mode: 'insensitive' } },
      ];
    }

    const orderByField = this.resolveSortField(q.sortBy);
    const orderByDir = q.order === 'asc' ? 'asc' : 'desc';

    const [rawData, total] = await this.prisma.$transaction([
      this.prisma.lectura.findMany({
        where,
        include: {
          periodo: true,
          incidencias: true,
          medidor: { include: { suministro: { include: { zona: true } } } },
          registradoPor: { select: { id: true, nombres: true, apellidos: true } },
        },
        orderBy: { [orderByField]: orderByDir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.lectura.count({ where }),
    ]);

    const data = rawData.map((lectura) => this.mapLecturaToResponse(lectura));

    return buildPaginatedResponse(data, total, page, limit);
  }

  private resolveSortField(sortBy?: string): string {
    const allowed: Record<string, string> = {
      fechaRegistro: 'fechaRegistro',
      fechaLectura: 'fechaLectura',
      consumoKwh: 'consumoKwh',
      id: 'id',
    };
    return allowed[sortBy ?? ''] ?? 'fechaRegistro';
  }

  private mapLecturaToResponse(lectura: any) {
    const meses = [
      '',
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    const periodo = lectura.periodo;
    const medidor = lectura.medidor;
    const suministro = medidor?.suministro;
    const zona = suministro?.zona;

    return {
      id: lectura.id,
      medidorId: lectura.medidorId,
      numeroMedidor: medidor?.numeroMedidor ?? null,
      suministroId: suministro?.id ?? null,
      codigoSuministro: suministro?.codigoSuministro ?? null,
      zonaId: zona?.id ?? null,
      zona: zona?.nombreZona ?? null,
      distrito: zona?.distrito ?? null,
      periodoId: lectura.periodoId,
      anio: periodo?.anio ?? null,
      mes: periodo?.mes ?? null,
      periodoLabel: periodo ? `${meses[periodo.mes]} ${periodo.anio}` : null,
      fechaLectura: lectura.fechaLectura ? new Date(lectura.fechaLectura).toISOString().split('T')[0] : null,
      lecturaAnterior: Number(lectura.lecturaAnterior ?? 0),
      lecturaActual: Number(lectura.lecturaActual ?? 0),
      consumoKwh: Number(lectura.consumoKwh ?? 0),
      estadoLectura: lectura.estadoLectura ?? 'VALIDA',
      observacion: lectura.observacion ?? '-',
      incidencias: lectura.incidencias ?? [],
      registradoPor: lectura.registradoPor ?? null,
      fechaRegistro: lectura.fechaRegistro ? new Date(lectura.fechaRegistro).toISOString() : null,
    };
  }

  findOne(id: number) {
    return this.prisma.lectura.findUnique({
      where: { id },
      include: { periodo: true, incidencias: true, medidor: { include: { suministro: { include: { zona: true } } } } },
    });
  }

  findLatestByMedidor(medidorId: number) {
    return this.prisma.lectura.findFirst({
      where: { medidorId },
      include: { periodo: true, incidencias: true, medidor: { include: { suministro: { include: { zona: true } } } } },
      orderBy: [{ periodo: { anio: 'desc' } }, { periodo: { mes: 'desc' } }, { fechaLectura: 'desc' }],
    });
  }

  findMedidorById(id: number) {
    return this.prisma.medidor.findUnique({ where: { id } });
  }

  async existsForMedidorPeriodo(medidorId: number, periodoId: number) {
    const exists = await this.prisma.lectura.findUnique({ where: { medidorId_periodoId: { medidorId, periodoId } } });
    return Boolean(exists);
  }

  createWithIncidencia(dto: CreateLecturaDto, registradoPorId: number, consumoKwh: number, incidencia: IncidenciaAutomatica | null) {
    return this.prisma.$transaction(async (tx) => {
      const lectura = await tx.lectura.create({
        data: {
          medidorId: dto.medidorId,
          periodoId: dto.periodoId,
          lecturaAnterior: toDecimal(dto.lecturaAnterior),
          lecturaActual: toDecimal(dto.lecturaActual),
          consumoKwh: toDecimal(consumoKwh),
          fechaLectura: dto.fechaLectura,
          observacion: dto.observacion,
          registradoPorId,
        },
      });

      if (incidencia) await tx.incidencia.create({ data: { lecturaId: lectura.id, ...incidencia } });
      return tx.lectura.findUnique({ where: { id: lectura.id }, include: { incidencias: true, periodo: true, medidor: true } });
    });
  }

  update(id: number, dto: UpdateLecturaDto, consumoKwh: number, estadoLectura: EstadoLectura) {
    const data = {
      ...dto,
      lecturaAnterior: dto.lecturaAnterior === undefined ? undefined : toDecimal(dto.lecturaAnterior),
      lecturaActual: dto.lecturaActual === undefined ? undefined : toDecimal(dto.lecturaActual),
      consumoKwh: toDecimal(consumoKwh),
      estadoLectura,
    };

    return this.prisma.lectura.update({ where: { id }, data });
  }

  deleteWithIncidencias(id: number) {
    return this.prisma.$transaction(async (tx) => {
      await tx.incidencia.deleteMany({ where: { lecturaId: id } });
      return tx.lectura.delete({ where: { id } });
    });
  }

  async prepareForRegistro(medidorId: number) {
    const medidor = await this.prisma.medidor.findUnique({
      where: { id: medidorId },
      include: { suministro: { include: { zona: true } } },
    });

    if (!medidor) return null;

    const ultimaLectura = await this.prisma.lectura.findFirst({
      where: { medidorId },
      orderBy: [{ periodo: { anio: 'desc' } }, { periodo: { mes: 'desc' } }],
      select: { lecturaActual: true, periodo: { select: { anio: true, mes: true } } },
    });

    let periodoSugerido: { anio: number; mes: number } | null = null;
    if (ultimaLectura) {
      const nextMes = ultimaLectura.periodo.mes + 1;
      if (nextMes > 12) {
        periodoSugerido = { anio: ultimaLectura.periodo.anio + 1, mes: 1 };
      } else {
        periodoSugerido = { anio: ultimaLectura.periodo.anio, mes: nextMes };
      }
    }

    return {
      suministro: {
        id: medidor.suministroId,
        codigoSuministro: medidor.suministro.codigoSuministro,
        tipoCliente: medidor.suministro.tipoCliente,
        zona: medidor.suministro.zona.nombreZona,
        distrito: medidor.suministro.zona.distrito,
      },
      medidor: {
        id: medidor.id,
        numeroMedidor: medidor.numeroMedidor,
        estado: medidor.estado,
      },
      ultimaLectura: ultimaLectura
        ? {
            lecturaActual: Number(ultimaLectura.lecturaActual),
            periodo: `${ultimaLectura.periodo.anio}-${String(ultimaLectura.periodo.mes).padStart(2, '0')}`,
          }
        : null,
      periodoSugerido,
    };
  }
}
