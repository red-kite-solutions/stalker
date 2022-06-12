import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { json } from 'express';
import { AppModule } from './modules/app.module';

async function bootstrap() {
  const adapter = new ExpressAdapter();
  const app = await NestFactory.create(AppModule, adapter, {
    cors: {
      origin: process.env.STALKER_URL,
    },
    logger: ['debug', 'warn', 'error'],
  });
  app.enableCors({
    origin: process.env.STALKER_URL,
  });
  app.use(json({ limit: '10mb' }));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen(3000);
}
bootstrap();
