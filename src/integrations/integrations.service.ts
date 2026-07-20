import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { EstadoIncidencia } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { mapIncidentToSigom } from './sigom-payload.mapper';
import { SigomClient } from './sigom.client';
import { WorkOrderClosedEventDto } from './dto/work-order-closed-event.dto';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sigomClient: SigomClient,
  ) {}

  async deriveToSigom(incidentId: number) {
    const incident = await this.prisma.incidencia.findUnique({
      where: { id: incidentId },
      include: {
        lectura: {
          include: {
            medidor: {
              include: { suministro: { include: { zona: true } } },
            },
          },
        },
      },
    });
    if (!incident) throw new NotFoundException('Incidencia no encontrada.');
    if (incident.estado !== EstadoIncidencia.PENDIENTE) {
      throw new ConflictException({
        code: 'INCIDENT_NOT_PENDING',
        message: 'Solo se pueden derivar incidencias pendientes.',
      });
    }

    const workOrder = await this.sigomClient.createWorkOrder(
      mapIncidentToSigom(incident),
      `siscon-incident-${incident.id}`,
    );
    const updated = await this.prisma.incidencia.update({
      where: { id: incident.id },
      data: {
        estado: EstadoIncidencia.DERIVADA_A_SIGOM,
        sigomWorkOrderId: workOrder.id,
        sigomWorkOrderCode: workOrder.code,
        derivedAt: new Date(),
      },
    });

    return {
      data: { incidentId: updated.id, workOrderId: workOrder.id, workOrderCode: workOrder.code },
      message: 'Incidencia derivada a SIGOM correctamente.',
    };
  }

  async receiveWorkOrderClosed(event: WorkOrderClosedEventDto, idempotencyKey?: string) {
    if (!idempotencyKey) {
      throw new BadRequestException({
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        message: 'Idempotency-Key es obligatorio.',
      });
    }

    const payloadHash = createHash('sha256').update(JSON.stringify(event)).digest('hex');
    const previous = await this.prisma.integrationInbox.findUnique({ where: { idempotencyKey } });
    if (previous) {
      if (previous.payloadHash !== payloadHash) {
        throw new ConflictException({
          code: 'IDEMPOTENCY_KEY_REUSED',
          message: 'La clave de idempotencia fue usada con otro payload.',
        });
      }
      return previous.responseBody;
    }

    const incidentId = Number(event.incident.externalId);
    if (!Number.isSafeInteger(incidentId) || incidentId < 1) {
      throw new BadRequestException({ code: 'INVALID_INCIDENT_REFERENCE', message: 'La referencia de incidencia es inválida.' });
    }

    const result = await this.prisma.$transaction(async (client) => {
      const incident = await client.incidencia.findUnique({ where: { id: incidentId } });
      if (!incident) throw new NotFoundException('Incidencia no encontrada.');
      if (incident.estado !== EstadoIncidencia.DERIVADA_A_SIGOM) {
        throw new ConflictException({ code: 'INCIDENT_NOT_DERIVED', message: 'La incidencia no está derivada a SIGOM.' });
      }
      if (incident.sigomWorkOrderId !== event.workOrder.id || incident.sigomWorkOrderCode !== event.workOrder.code) {
        throw new ConflictException({
          code: 'SIGOM_WORK_ORDER_MISMATCH',
          message: 'La orden recibida no corresponde a la incidencia derivada.',
        });
      }

      const response = {
        data: { incidentId: incident.id, status: EstadoIncidencia.RESUELTA },
        message: 'Incidencia resuelta desde SIGOM correctamente.',
      };
      await client.incidencia.update({
        where: { id: incident.id },
        data: { estado: EstadoIncidencia.RESUELTA, resolvedAt: new Date(event.workOrder.closedAt) },
      });
      await client.integrationInbox.create({
        data: { idempotencyKey, payloadHash, responseBody: response, incidentId: incident.id },
      });
      return response;
    });

    return result;
  }
}
