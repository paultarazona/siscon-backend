import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, timingSafeEqual } from 'crypto';

@Injectable()
export class SigomHmacGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      method: string;
      originalUrl: string;
      rawBody?: Buffer;
      body?: unknown;
      headers: Record<string, string | undefined>;
    }>();
    const authorization = request.headers.authorization;
    const timestamp = request.headers['x-sigom-timestamp'];
    const requestId = request.headers['x-request-id'];
    const secret = this.config.get<string>('SISCON_HMAC_SECRET');

    if (!secret || !authorization?.startsWith('HMAC ') || !timestamp || !requestId) {
      throw this.invalidSignature();
    }

    const timestampMs = Date.parse(timestamp);
    const maxAgeSeconds = Number(this.config.get('SIGOM_HMAC_MAX_AGE_SECONDS', 300));
    if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > maxAgeSeconds * 1000) {
      throw new UnauthorizedException({
        code: 'EXPIRED_INTEGRATION_REQUEST',
        message: 'La solicitud de integración expiró.',
      });
    }

    const rawBody = request.rawBody?.toString('utf8') ?? JSON.stringify(request.body ?? {});
    const bodyHash = createHash('sha256').update(rawBody).digest('hex');
    const path = request.originalUrl.split('?')[0];
    const canonicalRequest = `${request.method.toUpperCase()}\n${path}\n${timestamp}\n${requestId}\n${bodyHash}`;
    const expected = createHmac('sha256', secret).update(canonicalRequest).digest('hex');
    const received = authorization.slice('HMAC '.length);

    if (received.length !== expected.length || !timingSafeEqual(Buffer.from(received), Buffer.from(expected))) {
      throw this.invalidSignature();
    }

    return true;
  }

  private invalidSignature() {
    return new UnauthorizedException({
      code: 'INVALID_INTEGRATION_SIGNATURE',
      message: 'La firma de integración es inválida.',
    });
  }
}
