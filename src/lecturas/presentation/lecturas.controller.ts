import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { LecturasService } from '../application/lecturas.service';
import { CreateLecturaDto } from '../dto/create-lectura.dto';
import { LecturaFilterDto } from '../dto/lectura-filter.dto';
import { PrevisualizarLecturaDto } from '../dto/previsualizar-lectura.dto';
import { UltimaLecturaQueryDto } from '../dto/ultima-lectura-query.dto';
import { UpdateLecturaDto } from '../dto/update-lectura.dto';

@Controller('lecturas')
export class LecturasController {
  constructor(private readonly service: LecturasService) {}

  @Get()
  findAll(@Query() q: LecturaFilterDto) {
    return this.service.findAll(q);
  }

  @Get('parametros')
  parametros() {
    return this.service.parametros();
  }

  @Get('ultima')
  ultimaPorMedidor(@Query() q: UltimaLecturaQueryDto) {
    return this.service.ultimaPorMedidor(q.medidorId);
  }

  @Post('previsualizar')
  previsualizar(@Body() dto: PrevisualizarLecturaDto) {
    return this.service.previsualizar(dto);
  }

  @Post()
  create(@Body() dto: CreateLecturaDto, @CurrentUser() user: { id: number }) {
    return this.service.create(dto, user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLecturaDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
