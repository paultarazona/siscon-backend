import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateZonaDto } from './dto/create-zona.dto';
import { UpdateZonaDto } from './dto/update-zona.dto';
@Injectable() export class ZonasService { constructor(private prisma:PrismaService){} findAll(){return this.prisma.zonaOperativa.findMany({orderBy:{id:'asc'}});} async findOne(id:number){const row=await this.prisma.zonaOperativa.findUnique({where:{id}}); if(!row) throw new NotFoundException('Zona no encontrada'); return row;} create(dto:CreateZonaDto){return this.prisma.zonaOperativa.create({data:dto});} async update(id:number,dto:UpdateZonaDto){await this.findOne(id); return this.prisma.zonaOperativa.update({where:{id},data:dto});} async remove(id:number){await this.findOne(id); return this.prisma.zonaOperativa.delete({where:{id}});} }
