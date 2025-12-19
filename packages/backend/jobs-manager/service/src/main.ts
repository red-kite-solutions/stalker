import { NestApplicationOptions, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import {
  DocumentBuilder,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { json } from 'express';
import { readFileSync } from 'node:fs';
import { KeepAliveStrategy } from './keep-alive-strategy';
import { isConsumerMode } from './modules/app.constants';
import { AppModule } from './modules/app.module';
import { DataSource } from './modules/database/data-source/data-source.model';
import { JobParameter } from './modules/database/subscriptions/subscriptions.type';
import { mapSecurityScopesToDescription } from './utils/swagger.utils';

async function bootstrap() {
  const adapter = new ExpressAdapter();

  const options: NestApplicationOptions = {
    cors: {
      origin: process.env.RK_URL,
    },
    logger: ['debug', 'log', 'warn', 'error'],
  };

  // Setting up https for prod environments
  if (
    process.env.JM_ENVIRONMENT !== 'tests' &&
    process.env.JM_ENVIRONMENT !== 'dev'
  ) {
    options.httpsOptions = {
      key: readFileSync('/certs/ssl-private.key'),
      cert: readFileSync('/certs/ssl-certificate-chain.pem'),
    };
  }

  if (isConsumerMode()) {
    const workerApp = await NestFactory.createMicroservice(AppModule, {
      strategy: new KeepAliveStrategy(),
    });

    await workerApp.listen();
  } else {
    const app = await NestFactory.create(AppModule, adapter, options);

    app.enableCors({
      origin: process.env.RK_URL,
    });
    // https://github.com/red-kite-solutions/stalker/issues/94
    app.use(json({ limit: '10mb' }));
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    // OpenAPI Setup
    const config = new DocumentBuilder()
      .setTitle('Red Kite API')
      .setDescription('The Red Kite external attack surface management API.')
      .addApiKey(
        {
          type: 'apiKey',
          name: 'x-api-key',
          in: 'header',
        },
        'apiKey',
      )
      .addBearerAuth()
      .setVersion(process.env.RK_VERSION)
      .build();

    const documentFactory = () => {
      const options: SwaggerDocumentOptions = {
        deepScanRoutes: true,
        extraModels: [JobParameter, DataSource],
      };
      const doc = SwaggerModule.createDocument(app, config, options);

      // Setting up ObjectIds in the OpenAPI documentation to string
      doc.components = doc.components || {};
      doc.components.schemas = doc.components.schemas || {};
      doc.components.schemas.ObjectId = {
        type: 'string',
        example: '507f1f77bcf86cd799439011',
        description: 'MongoDB ObjectId represented as string',
      };

      return mapSecurityScopesToDescription(doc);
    };
    SwaggerModule.setup('docs', app, documentFactory);

    useContainer(app.select(AppModule), { fallbackOnErrors: true });
    await app.listen(3000);
  }
}

bootstrap();
