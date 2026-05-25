import { Controller, Get, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
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
}
