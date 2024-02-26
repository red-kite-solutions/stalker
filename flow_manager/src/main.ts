import { NestApplicationOptions, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { useContainer } from 'class-validator';
import { json } from 'express';
import { readFileSync } from 'node:fs';
import { AppModule } from './modules/app.module';

async function bootstrap() {
  const adapter = new ExpressAdapter();

  const options: NestApplicationOptions = {
    cors: {
      origin: process.env.STALKER_URL,
    },
    logger: ['debug', 'warn', 'error'],
  };

  // Setting up https for prod environments
  if (
    process.env.FM_ENVIRONMENT !== 'tests' &&
    process.env.FM_ENVIRONMENT !== 'dev'
  ) {
    options.httpsOptions = {
      key: readFileSync('/certs/ssl-private.key'),
      cert: readFileSync('/certs/ssl-certificate-chain.pem'),
    };
  }

  const app = await NestFactory.create(AppModule, adapter, options);
  app.enableCors({
    origin: process.env.STALKER_URL,
  });
  // https://github.com/red-kite-solutions/stalker/issues/94
  app.use(json({ limit: '10mb' }));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  await app.listen(3000);
}

bootstrap();
