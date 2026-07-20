import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const config = app.get(ConfigService);
  const corsOrigins = (config.get<string>('CORS_ORIGIN') ?? 'http://localhost:5173,http://localhost:5174').split(',');
  app.enableCors({ origin: corsOrigins, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SISCON-ENOSA API')
    .setDescription('API REST para gestión de suministros, medidores, lecturas eléctricas, incidencias, dashboard y reportes operativos.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, { swaggerOptions: { persistAuthorization: true } });

  await app.listen(config.get<number>('PORT') ?? 3000);
}
bootstrap();
