import { UnauthorizedException } from '@nestjs/common';
import { createHash, createHmac } from 'crypto';
import { SigomHmacGuard } from './sigom-hmac.guard';

describe('SigomHmacGuard', () => {
  const secret = 'test-sigom-secret';
  const body = JSON.stringify({ eventType: 'work-order.closed' });
  const timestamp = new Date().toISOString();
  const requestId = 'event-1';
  const path = '/integrations/sigom/work-order-events';
  const signature = createHmac('sha256', secret)
    .update(`POST\n${path}\n${timestamp}\n${requestId}\n${createHash('sha256').update(body).digest('hex')}`)
    .digest('hex');

  function context(authorization: string) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'POST',
          originalUrl: path,
          rawBody: Buffer.from(body),
          headers: {
            authorization,
            'x-sigom-timestamp': timestamp,
            'x-request-id': requestId,
          },
        }),
      }),
    } as any;
  }

  it('acepta un webhook firmado por SIGOM', () => {
    const guard = new SigomHmacGuard({ get: (key: string, fallback?: number) => key === 'SISCON_HMAC_SECRET' ? secret : fallback } as any);

    expect(guard.canActivate(context(`HMAC ${signature}`))).toBe(true);
  });

  it('rechaza una firma alterada', () => {
    const guard = new SigomHmacGuard({ get: (key: string, fallback?: number) => key === 'SISCON_HMAC_SECRET' ? secret : fallback } as any);

    expect(() => guard.canActivate(context('HMAC invalid'))).toThrow(UnauthorizedException);
  });
});
