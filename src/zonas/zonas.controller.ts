import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CreateZonaDto } from './dto/create-zona.dto';
import { UpdateZonaDto } from './dto/update-zona.dto';
import { ZonasService } from './zonas.service';
@Controller('zonas') export class ZonasController { constructor(private readonly service: ZonasService) {} @Get() findAll(){return this.service.findAll();} @Post() create(@Body() dto:CreateZonaDto){return this.service.create(dto);} @Get(':id') findOne(@Param('id', ParseIntPipe) id:number){return this.service.findOne(id);} @Patch(':id') update(@Param('id', ParseIntPipe) id:number,@Body() dto:UpdateZonaDto){return this.service.update(id,dto);} @Delete(':id') remove(@Param('id', ParseIntPipe) id:number){return this.service.remove(id);} }
