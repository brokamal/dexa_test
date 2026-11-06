import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MSG } from '@app/common';
import {
  CheckInPayload,
  CheckOutPayload,
  AttendanceQuery,
} from './types';
import { AttendanceService } from './attendance.service';

@Controller()
export class AttendanceController {
  constructor(private readonly svc: AttendanceService) {}

  @MessagePattern(MSG.ATT_CHECK_IN)
  checkIn(@Payload() data: CheckInPayload) {
    return this.svc.checkIn(data);
  }

  @MessagePattern(MSG.ATT_CHECK_OUT)
  checkOut(@Payload() data: CheckOutPayload) {
    return this.svc.checkOut(data);
  }

  @MessagePattern(MSG.ATT_TODAY)
  today(@Payload() data: { employeeId: number }) {
    return this.svc.today(data.employeeId);
  }

  @MessagePattern(MSG.ATT_LIST)
  list(@Payload() q: AttendanceQuery) {
    return this.svc.list(q);
  }
}
