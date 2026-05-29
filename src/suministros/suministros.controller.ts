import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { CreateSuministroDto } from './dto/create-suministro.dto';
import { SuministroFilterDto } from './dto/suministro-filter.dto';
import { UpdateSuministroDto } from './dto/update-suministro.dto';
import { SuministrosService } from './suministros.service';

@Controller('suministros')
export class SuministrosController {
  constructor(private service: SuministrosService) {}

  @Get()
  findAll(@Query() q: SuministroFilterDto) {
    return this.service.findAll(q);
  }

  @Post()
  create(@Body() dto: CreateSuministroDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSuministroDto) {
    return this.service.update(id, dto);
  }

  @Put(':id')
  replace(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSuministroDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
