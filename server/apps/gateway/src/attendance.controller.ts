import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { MSG, extFromMime } from '@app/common';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  AuthPayload,
} from './guards';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function toPhotoPayload(file?: Express.Multer.File) {
  if (!file) return undefined;
  if (file.size > MAX_SIZE) {
    throw new BadRequestException('Photo must be smaller than 5 MB');
  }
  const ext = extFromMime(file.mimetype);
  if (!ext) throw new BadRequestException('Only JPG or PNG photos are allowed');
  return { base64: file.buffer.toString('base64'), ext };
}

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(
    @Inject('ATTENDANCE_CLIENT') private readonly client: ClientProxy,
  ) {}

  @Post('check-in')
  @UseInterceptors(FileInterceptor('photo'))
  @Roles('employee', 'admin')
  checkIn(
    @Req() req: { user: { sub: number } },
    @UploadedFile() photo: Express.Multer.File,
    @Body() body: { note?: string },
  ) {
    return firstValueFrom(
      this.client
        .send(MSG.ATT_CHECK_IN, {
          employeeId: req.user.sub,
          photo: toPhotoPayload(photo),
          note: body?.note,
        })
        .pipe(timeout(10000)),
    );
  }

  @Post('check-out')
  @UseInterceptors(FileInterceptor('photo'))
  @Roles('employee', 'admin')
  checkOut(
    @Req() req: { user: { sub: number } },
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    return firstValueFrom(
      this.client
        .send(MSG.ATT_CHECK_OUT, {
          employeeId: req.user.sub,
          photo: toPhotoPayload(photo),
        })
        .pipe(timeout(10000)),
    );
  }

  @Get('me/today')
  @Roles('employee', 'admin')
  todayMe(@Req() req: { user: { sub: number } }) {
    return firstValueFrom(
      this.client
        .send(MSG.ATT_TODAY, { employeeId: req.user.sub })
        .pipe(timeout(5000)),
    );
  }

  @Get()
  list(
    @Req() req: { user: AuthPayload },
    @Query('employeeId') employeeId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const employeesAllowed = req.user.role === 'admin';
    return firstValueFrom(
      this.client
        .send(MSG.ATT_LIST, {
          employeeId: employeesAllowed
            ? employeeId
              ? Number(employeeId)
              : undefined
            : req.user.sub,
          from,
          to,
        })
        .pipe(timeout(5000)),
    );
  }
}
