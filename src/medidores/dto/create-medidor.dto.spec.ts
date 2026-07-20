import 'reflect-metadata';
import { validate } from 'class-validator';
import { CreateMedidorDto } from './create-medidor.dto';

describe('CreateMedidorDto', () => {
  it('requiere marca, modelo y fecha de instalación', async () => {
    const dto = Object.assign(new CreateMedidorDto(), {
      numeroMedidor: 'MED-000001',
      suministroId: 1,
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(expect.arrayContaining([
      'marca',
      'modelo',
      'fechaInstalacion',
    ]));
  });
});
