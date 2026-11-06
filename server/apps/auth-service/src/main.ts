import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    { transport: Transport.TCP, options: { host: '0.0.0.0', port: Number(process.env.AUTH_PY ?? 4001) } },
  );
  await app.listen();
  console.log(`auth-service up on :${process.env.AUTH_PY ?? 4001}`);
}
bootstrap();
