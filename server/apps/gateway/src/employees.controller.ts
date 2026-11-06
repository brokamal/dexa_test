import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { firstValueFrom, timeout } from 'rxjs';
import { MSG } from '@app/common';
import { CreateEmployeeDto, UpdateEmployeeDto } from '@app/common';
import { JwtAuthGuard, RolesGuard, Roles, AuthPayload } from './guards';

@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class EmployeesController {
  constructor(
    @Inject('EMPLOYEE_CLIENT') private readonly client: ClientProxy,
  ) {}

  @Get()
  list(@Query('search') search?: string) {
    return firstValueFrom(
      this.client.send(MSG.EMP_LIST, { search }).pipe(timeout(5000)),
    );
  }

  @Post()
  create(@Body() dto: CreateEmployeeDto) {
    return firstValueFrom(
      this.client.send(MSG.EMP_CREATE, dto).pipe(timeout(5000)),
    );
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEmployeeDto) {
    return firstValueFrom(
      this.client.send(MSG.EMP_UPDATE, { id, ...dto }).pipe(timeout(5000)),
    );
  }
}
