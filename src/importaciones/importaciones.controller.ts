import { Controller, Get, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ImportacionFilterDto } from './dto/importacion-filter.dto';
import { ImportacionesService } from './importaciones.service';

@Controller('importaciones')
export class ImportacionesController {
  constructor(private service: ImportacionesService) {}

  @Post('csv')
  @UseInterceptors(FileInterceptor('file'))
  importar(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: { id: number }) {
    return this.service.importarCsv(file, user.id);
  }

  @Get()
  findAll(@Query() q: ImportacionFilterDto) {
    return this.service.findAll(q);
  }
}
