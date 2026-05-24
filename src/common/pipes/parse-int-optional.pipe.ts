import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseIntOptionalPipe implements PipeTransform<string | undefined, number | undefined> {
  transform(value: string | undefined) {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) throw new BadRequestException('El parámetro debe ser un entero');
    return parsed;
  }
}
