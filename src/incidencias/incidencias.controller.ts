import { Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { IncidenciaFilterDto } from './dto/incidencia-filter.dto';
import { IncidenciasService } from './incidencias.service';

@Controller('incidencias')
export class IncidenciasController {
  constructor(private service: IncidenciasService) {}

  @Get()
  findAll(@Query() q: IncidenciaFilterDto) {
    return this.service.findAll(q);
  }

  @Patch(':id/resolver')
  resolver(@Param('id', ParseIntPipe) id: number) {
    return this.service.resolver(id);
  }

  @Post(':id/work-orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPERADOR)
  deriveToSigom(@Param('id', ParseIntPipe) id: number) {
    return this.service.deriveToSigom(id);
  }
}
