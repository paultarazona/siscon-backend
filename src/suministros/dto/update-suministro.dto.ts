import { PartialType } from '@nestjs/mapped-types';
import { CreateSuministroDto } from './create-suministro.dto';
export class UpdateSuministroDto extends PartialType(CreateSuministroDto) {}
