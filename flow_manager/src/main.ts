import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './modules/app.module';

async function bootstrap() {
  const adapter = new ExpressAdapter();
  const app = await NestFactory.create(AppModule, adapter, {
    bodyParser: true,
    cors: {
      origin: 'http://localhost:4200',
    },
  });
  await app.listen(3000);
}
bootstrap();
