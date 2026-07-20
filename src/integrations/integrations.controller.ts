import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { IntegrationsService } from './integrations.service';
import { WorkOrderClosedEventDto } from './dto/work-order-closed-event.dto';
import { SigomHmacGuard } from './guards/sigom-hmac.guard';

@Controller('integrations/sigom')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Public()
  @Post('work-order-events')
  @UseGuards(SigomHmacGuard)
  receiveWorkOrderEvent(
    @Body() event: WorkOrderClosedEventDto,
    @Headers('idempotency-key') idempotencyKey: string,
  ) {
    return this.integrationsService.receiveWorkOrderClosed(event, idempotencyKey);
  }
}
