import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EstadoGeneral, Prisma } from '@prisma/client';
import { buildPaginatedResponse, PaginatedResult } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateZonaDto } from './dto/create-zona.dto';
import { UpdateZonaDto } from './dto/update-zona.dto';
import { ZonaFilterDto } from './dto/zona-filter.dto';

@Injectable()
export class ZonasService {
  constructor(private prisma: PrismaService) {}

  async findAll(q: ZonaFilterDto): Promise<PaginatedResult> {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;

    const where: Prisma.ZonaOperativaWhereInput = {
      departamento: this.optionalText(q.departamento),
      provincia: this.optionalText(q.provincia),
      distrito: this.optionalText(q.distrito),
      estado: q.estado,
    };

    const search = this.optionalText(q.q);

    if (search) {
      where.OR = [
        { codigoZona: { contains: search, mode: 'insensitive' } },
        { nombreZona: { contains: search, mode: 'insensitive' } },
        { departamento: { contains: search, mode: 'insensitive' } },
        { provincia: { contains: search, mode: 'insensitive' } },
        { distrito: { contains: search, mode: 'insensitive' } },
      ];

      const estadoSearch = search.toUpperCase();
      if (Object.values(EstadoGeneral).includes(estadoSearch as EstadoGeneral)) {
        where.OR.push({ estado: { equals: estadoSearch as EstadoGeneral } });
      }
    }

    const orderByField = this.resolveSortField(q.sortBy);
    const orderByDir = q.order === 'desc' ? 'desc' : 'asc';

    const [data, total] = await this.prisma.$transaction([
      this.prisma.zonaOperativa.findMany({
        where,
        orderBy: { [orderByField]: orderByDir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.zonaOperativa.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  private resolveSortField(sortBy?: string): string {
    const allowed: Record<string, string> = {
      codigoZona: 'codigoZona',
      nombreZona: 'nombreZona',
      departamento: 'departamento',
      provincia: 'provincia',
      distrito: 'distrito',
      estado: 'estado',
      id: 'id',
    };

    return allowed[sortBy ?? ''] ?? 'id';
  }

  private optionalText(value?: string) {
    const text = value?.trim();
    return text || undefined;
  }

  async findOne(id: number) {
    const row = await this.prisma.zonaOperativa.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Zona no encontrada');
    return row;
  }

  async create(dto: CreateZonaDto) {
    await this.validateTerritorioControlado(dto.departamento, dto.provincia, dto.distrito);
    await this.validateCodigoZonaUnico(dto.codigoZona);

    try {
      return await this.prisma.zonaOperativa.create({ data: dto });
    } catch (error) {
      this.handleCodigoZonaUniqueError(error, dto.codigoZona);
      throw error;
    }
  }

  async update(id: number, dto: UpdateZonaDto) {
    const current = await this.findOne(id);
    await this.validateTerritorioControlado(
      dto.departamento ?? current.departamento,
      dto.provincia ?? current.provincia,
      dto.distrito ?? current.distrito,
    );

    if (dto.codigoZona) {
      await this.validateCodigoZonaUnico(dto.codigoZona, id);
    }

    try {
      return await this.prisma.zonaOperativa.update({ where: { id }, data: dto });
    } catch (error) {
      this.handleCodigoZonaUniqueError(error, dto.codigoZona ?? current.codigoZona);
      throw error;
    }
  }

  private async validateCodigoZonaUnico(codigoZona: string, currentZonaId?: number) {
    const exists = await this.prisma.zonaOperativa.findUnique({
      where: { codigoZona },
      select: { id: true },
    });

    if (exists && exists.id !== currentZonaId) {
      throw new ConflictException(`El código de zona ${codigoZona} ya se encuentra registrado.`);
    }
  }

  private handleCodigoZonaUniqueError(error: unknown, codigoZona: string) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target) ? error.meta.target : [];
      if (target.includes('codigoZona')) {
        throw new ConflictException(`El código de zona ${codigoZona} ya se encuentra registrado.`);
      }
    }
  }

  private async validateTerritorioControlado(departamento: string, provincia: string, distrito: string) {
    const exists = await this.prisma.zonaOperativa.findFirst({
      where: {
        departamento,
        provincia,
        distrito,
      },
      select: { id: true },
    });

    if (!exists) {
      throw new BadRequestException('Departamento, provincia y distrito deben pertenecer al catálogo territorial del MVP');
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.zonaOperativa.delete({ where: { id } });
  }
}
