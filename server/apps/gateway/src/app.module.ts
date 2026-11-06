import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { AttendanceController } from './attendance.controller';
import { AuthController } from './auth.controller';
import { EmployeesController } from './employees.controller';
import { JwtAuthGuard, RolesGuard } from './guards';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ['../../.env'] }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (cs: ConfigService) => ({
        secret: cs.get('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    ClientsModule.register([
      {
        name: 'AUTH_CLIENT',
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: Number(process.env.AUTH_PY ?? 4001) },
      },
      {
        name: 'EMPLOYEE_CLIENT',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: Number(process.env.EMPLOYEE_PORT ?? 4002),
        },
      },
      {
        name: 'ATTENDANCE_CLIENT',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: Number(process.env.ATTENDANCE_PORT ?? 4003),
        },
      },
    ]),
  ],
  controllers: [AuthController, EmployeesController, AttendanceController],
  providers: [JwtAuthGuard, RolesGuard],
})
export class AppModule {}
