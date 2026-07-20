import { validate } from 'class-validator';
import { TipoCliente } from '@prisma/client';
import { CreateSuministroDto } from './create-suministro.dto';

describe('CreateSuministroDto', () => {
  it('requiere dirección referencial', async () => {
    const dto = Object.assign(new CreateSuministroDto(), {
      codigoSuministro: 'SUM-000001',
      tipoCliente: TipoCliente.RESIDENCIAL,
      zonaId: 1,
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toContain('direccionReferencial');
  });
});
