import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance, Employee, mysqlOptions } from '@app/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['../../.env'],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cs: ConfigService) => mysqlOptions(cs, [Attendance, Employee]),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Attendance, Employee]),
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
})
export class AppModule {}
