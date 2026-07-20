import { BadGatewayException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac } from 'crypto';

export type SigomWorkOrder = { id: string; code: string };

@Injectable()
export class SigomClient {
  constructor(private readonly config: ConfigService) {}

  async createWorkOrder(payload: unknown, idempotencyKey: string): Promise<SigomWorkOrder> {
    const url = this.config.get<string>('SIGOM_API_URL');
    const secret = this.config.get<string>('SIGOM_HMAC_SECRET');
    if (!url || !secret) {
      throw new ServiceUnavailableException({
        code: 'SIGOM_INTEGRATION_NOT_CONFIGURED',
        message: 'La integración con SIGOM no está configurada.',
      });
    }

    const body = JSON.stringify(payload);
    const timestamp = new Date().toISOString();
    const path = new URL(url).pathname;
    const bodyHash = createHash('sha256').update(body).digest('hex');
    const signature = createHmac('sha256', secret)
      .update(`POST\n${path}\n${timestamp}\n${idempotencyKey}\n${bodyHash}`)
      .digest('hex');

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `HMAC ${signature}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
          'X-Request-Id': idempotencyKey,
          'X-SISCON-Timestamp': timestamp,
        },
        body,
        signal: AbortSignal.timeout(Number(this.config.get('SIGOM_TIMEOUT_MS', 5_000))),
      });
    } catch {
      throw new ServiceUnavailableException({
        code: 'SIGOM_UNAVAILABLE',
        message: 'SIGOM no está disponible. Intenta derivar la incidencia nuevamente.',
      });
    }

    if (!response.ok) {
      let upstreamError: { code?: string; message?: string } | null = null;
      try {
        upstreamError = await response.json() as { code?: string; message?: string };
      } catch {
        upstreamError = null;
      }
      throw new BadGatewayException({
        code: upstreamError?.code ?? 'SIGOM_REQUEST_FAILED',
        message: upstreamError?.message ?? 'SIGOM rechazó la creación de la orden de trabajo.',
      });
    }

    const result = (await response.json()) as { data?: SigomWorkOrder };
    if (!result.data?.id || !result.data.code) {
      throw new BadGatewayException({
        code: 'SIGOM_INVALID_RESPONSE',
        message: 'SIGOM devolvió una respuesta inválida.',
      });
    }

    return result.data;
  }
}
