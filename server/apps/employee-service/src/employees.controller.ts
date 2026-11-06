import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateEmployeeDto, MSG, UpdateEmployeeDto } from '@app/common';
import { EmployeesService } from './employees.service';

@Controller()
export class EmployeesController {
  constructor(private readonly svc: EmployeesService) {}

  @MessagePattern(MSG.EMP_LIST)
  list(@Payload() filters: { search?: string }) {
    return this.svc.list(filters?.search);
  }

  @MessagePattern(MSG.EMP_CREATE)
  create(@Payload() dto: CreateEmployeeDto) {
    return this.svc.create(dto);
  }

  @MessagePattern(MSG.EMP_UPDATE)
  update(@Payload() data: { id: number } & UpdateEmployeeDto) {
    const { id, ...dto } = data;
    return this.svc.update(id, dto);
  }
}
