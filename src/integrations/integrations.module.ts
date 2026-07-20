import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { SigomClient } from './sigom.client';
import { SigomHmacGuard } from './guards/sigom-hmac.guard';

@Module({
  imports: [PrismaModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, SigomClient, SigomHmacGuard],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
