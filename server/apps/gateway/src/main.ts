import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import * as path from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  const origins = (process.env.CLIENT_ORIGINS ?? '').split(',').filter(Boolean);
  app.enableCors({ origin: origins, credentials: true });

  const uploadDir = path.resolve(process.cwd(), '../..', process.env.UPLOAD_DIR ?? 'uploads');
  if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
  app.useStaticAssets(uploadDir, { prefix: '/uploads' });

  await app.listen(Number(process.env.GATEWAY_PORT ?? 3000));
  console.log(
    `gateway up on :${process.env.GATEWAY_PORT ?? 3000} (uploads: ${uploadDir})`,
  );
}
bootstrap();
