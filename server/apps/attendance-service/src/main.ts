import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    { transport: Transport.TCP, options: { host: '0.0.0.0', port: Number(process.env.ATTENDANCE_PORT ?? 4003) } },
  );
  await app.listen();
  console.log(`attendance-service up on :${process.env.ATTENDANCE_PORT ?? 4003}`);
}
bootstrap();
