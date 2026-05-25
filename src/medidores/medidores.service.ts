import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildPaginatedResponse, PaginatedResult } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedidorDto } from './dto/create-medidor.dto';
import { MedidorFilterDto } from './dto/medidor-filter.dto';
import { UpdateMedidorDto } from './dto/update-medidor.dto';

@Injectable()
export class MedidoresService {
  constructor(private prisma: PrismaService) {}

  async findAll(q: MedidorFilterDto): Promise<PaginatedResult> {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;

    const where: Prisma.MedidorWhereInput = {
      estado: q.estado,
      suministroId: q.suministroId,
      marca: q.marca,
    };

    // Filter by zona through suministro relation
    if (q.zonaId) {
      where.suministro = { zonaId: q.zonaId };
    }

    if (q.search) {
      where.numeroMedidor = { contains: q.search, mode: 'insensitive' };
    }

    const orderByField = this.resolveSortField(q.sortBy);
    const orderByDir = q.order === 'asc' ? 'asc' : 'desc';

    const [data, total] = await this.prisma.$transaction([
      this.prisma.medidor.findMany({
        where,
        include: { suministro: { include: { zona: true } } },
        orderBy: { [orderByField]: orderByDir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.medidor.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  private resolveSortField(sortBy?: string): string {
    const allowed: Record<string, string> = {
      fechaInstalacion: 'fechaInstalacion',
      numeroMedidor: 'numeroMedidor',
      id: 'id',
    };
    return allowed[sortBy ?? ''] ?? 'fechaInstalacion';
  }

  async findOne(id: number) {
    const row = await this.prisma.medidor.findUnique({
      where: { id },
      include: { suministro: { include: { zona: true } }, lecturas: true },
    });
    if (!row) throw new NotFoundException('Medidor no encontrado');
    return row;
  }

  async create(dto: CreateMedidorDto) {
    await this.validateNumeroMedidorUnico(dto.numeroMedidor);

    try {
      return await this.prisma.medidor.create({ data: dto });
    } catch (error) {
      this.handleNumeroMedidorUniqueError(error, dto.numeroMedidor);
      throw error;
    }
  }

  async update(id: number, dto: UpdateMedidorDto) {
    const current = await this.findOne(id);

    if (dto.numeroMedidor) {
      await this.validateNumeroMedidorUnico(dto.numeroMedidor, id);
    }

    try {
      return await this.prisma.medidor.update({ where: { id }, data: dto });
    } catch (error) {
      this.handleNumeroMedidorUniqueError(error, dto.numeroMedidor ?? current.numeroMedidor);
      throw error;
    }
  }

  private async validateNumeroMedidorUnico(numeroMedidor: string, currentMedidorId?: number) {
    const exists = await this.prisma.medidor.findUnique({
      where: { numeroMedidor },
      select: { id: true },
    });

    if (exists && exists.id !== currentMedidorId) {
      throw new ConflictException(`El número de medidor ${numeroMedidor} ya se encuentra registrado.`);
    }
  }

  private handleNumeroMedidorUniqueError(error: unknown, numeroMedidor: string) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target) ? error.meta.target : [];
      if (target.includes('numeroMedidor')) {
        throw new ConflictException(`El número de medidor ${numeroMedidor} ya se encuentra registrado.`);
      }
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.medidor.delete({ where: { id } });
  }
}
