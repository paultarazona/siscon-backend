import { extractSessionCookie } from './jwt.strategy';

describe('extractSessionCookie', () => {
  it('extrae el token de la cookie de sesión', () => {
    expect(extractSessionCookie({
      headers: { cookie: 'theme=dark; siscon_session=token-de-sesion; locale=es' },
    })).toBe('token-de-sesion');
  });

  it('retorna null cuando no existe la cookie de sesión', () => {
    expect(extractSessionCookie({ headers: { cookie: 'theme=dark' } })).toBeNull();
  });
});
