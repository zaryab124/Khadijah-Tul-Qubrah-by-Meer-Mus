import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 4000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');

  // Global Prefix
  app.setGlobalPrefix(apiPrefix);

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Filters & Interceptors
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // CORS
  const corsOrigins = configService.get<string>('CORS_ORIGINS', '*');
  app.enableCors({
    origin: corsOrigins.includes(',') ? corsOrigins.split(',') : corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // OpenAPI / Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('KHADIJA-TUL-QUBRAH BY Meer&Mus API')
    .setDescription(
      'Enterprise API for Luxury Fashion Commerce, Bespoke Custom Design Requests, Quotation Revisions, Production Floor Management, and CRM.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your Bearer JWT token',
        in: 'header',
      },
      'bearer',
    )
    .addTag('Authentication', 'Customer and staff signup, login, token refresh, and OTP')
    .addTag('Brand Configuration', 'Centralized brand identity, color themes, and logo assets')
    .addTag('Users Management', 'User profile lookup and administrative role management')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'KHADIJA-TUL-QUBRAH BY Meer&Mus - API Documentation',
    customCss: `
      .topbar { background-color: #072A20 !important; }
      .swagger-ui .topbar .download-url-wrapper { display: none !important; }
    `,
  });

  await app.listen(port);
  logger.log(`================================================================`);
  logger.log(`KHADIJA-TUL-QUBRAH BY Meer&Mus API running on port : ${port}`);
  logger.log(`Base API endpoint : http://localhost:${port}/${apiPrefix}`);
  logger.log(`Swagger OpenAPI documentation : http://localhost:${port}/api/docs`);
  logger.log(`================================================================`);
}

bootstrap();
