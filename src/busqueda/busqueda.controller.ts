import { Controller, Get, Query } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

class BusquedaQueryDto {
  @IsString()
  @MaxLength(100)
  query: string;

  @IsOptional()
  @IsString()
  zona?: string;
}

@Controller('busqueda')
export class BusquedaController {
  constructor(private prisma: PrismaService) {}

  @Get('suministros-medidores')
  async buscar(@Query() q: BusquedaQueryDto) {
    const results = await this.prisma.medidor.findMany({
      where: {
        estado: 'ACTIVO',
        OR: [
          { numeroMedidor: { contains: q.query, mode: 'insensitive' } },
          { suministro: { codigoSuministro: { contains: q.query, mode: 'insensitive' } } },
          { suministro: { zona: { nombreZona: { contains: q.query, mode: 'insensitive' } } } },
          { suministro: { zona: { distrito: { contains: q.query, mode: 'insensitive' } } } },
        ],
      },
      include: {
        suministro: {
          include: { zona: true },
        },
      },
      take: 20,
      orderBy: { numeroMedidor: 'asc' },
    });

    return results.map((m) => ({
      suministroId: m.suministroId,
      codigoSuministro: m.suministro.codigoSuministro,
      medidorId: m.id,
      numeroMedidor: m.numeroMedidor,
      zona: m.suministro.zona.nombreZona,
      distrito: m.suministro.zona.distrito,
      tipoCliente: m.suministro.tipoCliente,
      estadoMedidor: m.estado,
    }));
  }
}
