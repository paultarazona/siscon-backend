import { Injectable } from '@nestjs/common';
import { EstadoLectura, Prisma } from '@prisma/client';
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
      medidor: { suministroId: q.suministroId, suministro: { zonaId: q.zonaId } },
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.lectura.findMany({
        where,
        include: {
          periodo: true,
          incidencias: true,
          medidor: { include: { suministro: { include: { zona: true } } } },
          registradoPor: { select: { id: true, nombres: true, apellidos: true } },
        },
        orderBy: { fechaLectura: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.lectura.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
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
}
