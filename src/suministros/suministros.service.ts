import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EstadoMedidor, Prisma } from '@prisma/client';
import { buildPaginatedResponse, PaginatedResult } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSuministroDto } from './dto/create-suministro.dto';
import { SuministroFilterDto } from './dto/suministro-filter.dto';
import { UpdateSuministroDto } from './dto/update-suministro.dto';

@Injectable()
export class SuministrosService {
  constructor(private prisma: PrismaService) {}

  async findAll(q: SuministroFilterDto): Promise<PaginatedResult> {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;

    const where: Prisma.SuministroWhereInput = {
      zonaId: q.zonaId,
      tipoCliente: q.tipoCliente,
      estado: q.estado,
      ...(q.observado ? { medidores: { some: { estado: EstadoMedidor.EN_REVISION } } } : {}),
    };

    if (q.search) {
      where.codigoSuministro = { contains: q.search, mode: 'insensitive' };
    }

    const orderByField = this.resolveSortField(q.sortBy);
    const orderByDir = q.order === 'asc' ? 'asc' : 'desc';

    const [data, total] = await this.prisma.$transaction([
      this.prisma.suministro.findMany({
        where,
        include: { zona: true },
        orderBy: { [orderByField]: orderByDir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.suministro.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  private resolveSortField(sortBy?: string): string {
    const allowed: Record<string, string> = {
      fechaAlta: 'fechaAlta',
      codigoSuministro: 'codigoSuministro',
      id: 'id',
    };
    return allowed[sortBy ?? ''] ?? 'fechaAlta';
  }

  async findOne(id: number) {
    const row = await this.prisma.suministro.findUnique({
      where: { id },
      include: { zona: true, medidores: true },
    });
    if (!row) throw new NotFoundException('Suministro no encontrado');
    return row;
  }

  async create(dto: CreateSuministroDto) {
    await this.validateCodigoSuministroUnico(dto.codigoSuministro);

    try {
      return await this.prisma.suministro.create({ data: dto });
    } catch (error) {
      this.handleCodigoSuministroUniqueError(error, dto.codigoSuministro);
      throw error;
    }
  }

  async update(id: number, dto: UpdateSuministroDto) {
    const current = await this.findOne(id);

    if (dto.codigoSuministro) {
      await this.validateCodigoSuministroUnico(dto.codigoSuministro, id);
    }

    try {
      return await this.prisma.suministro.update({ where: { id }, data: dto });
    } catch (error) {
      this.handleCodigoSuministroUniqueError(error, dto.codigoSuministro ?? current.codigoSuministro);
      throw error;
    }
  }

  private async validateCodigoSuministroUnico(codigoSuministro: string, currentSuministroId?: number) {
    const exists = await this.prisma.suministro.findUnique({
      where: { codigoSuministro },
      select: { id: true },
    });

    if (exists && exists.id !== currentSuministroId) {
      throw new ConflictException(`El código de suministro ${codigoSuministro} ya se encuentra registrado.`);
    }
  }

  private handleCodigoSuministroUniqueError(error: unknown, codigoSuministro: string) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target) ? error.meta.target : [];
      if (target.includes('codigoSuministro')) {
        throw new ConflictException(`El código de suministro ${codigoSuministro} ya se encuentra registrado.`);
      }
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.suministro.delete({ where: { id } });
  }
}
