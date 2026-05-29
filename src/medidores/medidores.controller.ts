import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { CreateMedidorDto } from './dto/create-medidor.dto';
import { MedidorFilterDto } from './dto/medidor-filter.dto';
import { UpdateMedidorDto } from './dto/update-medidor.dto';
import { MedidoresService } from './medidores.service';

@Controller('medidores')
export class MedidoresController {
  constructor(private service: MedidoresService) {}

  @Get()
  findAll(@Query() q: MedidorFilterDto) {
    return this.service.findAll(q);
  }

  @Post()
  create(@Body() dto: CreateMedidorDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMedidorDto) {
    return this.service.update(id, dto);
  }

  @Put(':id')
  replace(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMedidorDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
