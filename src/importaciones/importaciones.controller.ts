import { Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ImportacionesService } from './importaciones.service';
@Controller('importaciones') export class ImportacionesController{constructor(private service:ImportacionesService){} @Post('csv') @UseInterceptors(FileInterceptor('file')) importar(@UploadedFile() file: Express.Multer.File,@CurrentUser() user:{id:number}){return this.service.importarCsv(file,user.id);} @Get() findAll(){return this.service.findAll();}}
