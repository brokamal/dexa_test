import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import * as path from 'path';
import { Between, FindOptionsWhere, IsNull, LessThan, Repository, Not } from 'typeorm';
import { Attendance, today } from '@app/common';
import { CheckInPayload, CheckOutPayload, AttendanceQuery } from './types';

const AUTO_CHECKOUT_POLL_MS = 60_000;

@Injectable()
export class AttendanceService implements OnModuleInit, OnModuleDestroy {
  private readonly uploadDir: string;
  private readonly logger = new Logger(AttendanceService.name);
  private readonly autoCheckoutHour: number;
  private autoCheckoutTimer?: ReturnType<typeof setInterval>;
  private autoCheckoutRunning = false;

  constructor(
    @InjectRepository(Attendance)
    private readonly repo: Repository<Attendance>,
    private readonly cfg: ConfigService,
  ) {
    const dir = this.cfg.get<string>('UPLOAD_DIR') ?? 'uploads';
    this.uploadDir = path.isAbsolute(dir)
      ? dir
      : path.resolve(process.cwd(), '../..', dir);
    if (!existsSync(this.uploadDir)) mkdirSync(this.uploadDir, { recursive: true });

    const hour = Number(this.cfg.get<string>('AUTO_CHECKOUT_HOUR') ?? 17);
    this.autoCheckoutHour = Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : 17;
  }

  onModuleInit() {
    // Runs on startup too, so open attendance is closed even if the service
    // was restarted after the cutoff time.
    this.autoCheckout().catch((err) =>
      this.logger.error('Failed to run initial auto checkout', err),
    );
    this.autoCheckoutTimer = setInterval(() => {
      this.autoCheckout().catch((err) =>
        this.logger.error('Failed to run auto checkout', err),
      );
    }, AUTO_CHECKOUT_POLL_MS);
  }

  onModuleDestroy() {
    if (this.autoCheckoutTimer) clearInterval(this.autoCheckoutTimer);
  }

  async autoCheckout() {
    if (this.autoCheckoutRunning) return;
    this.autoCheckoutRunning = true;
    try {
      const now = new Date();
      const cutoff = new Date(now);
      cutoff.setHours(this.autoCheckoutHour, 0, 0, 0);
      if (now < cutoff) return;

      const result = await this.repo.update(
        {
          workDate: today(),
          checkInAt: LessThan(cutoff),
          checkOutAt: IsNull(),
        },
        { checkOutAt: cutoff },
      );

      if (result.affected) {
        this.logger.log(
          `Auto checked out ${result.affected} employee(s) at ${cutoff.toLocaleTimeString('id-ID')}`,
        );
      }
    } finally {
      this.autoCheckoutRunning = false;
    }
  }

  private savePhoto(photo: { base64: string; ext: string } | undefined) {
    if (!photo) return null;
    const buf = Buffer.from(photo.base64, 'base64');
    const name = `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${photo.ext}`;
    writeFileSync(path.join(this.uploadDir, name), buf);
    return `/uploads/${name}`;
  }

  async checkIn(data: CheckInPayload) {
    if (!data.photo) {
      throw new BadRequestException('Photo proof is required to check in');
    }

    const workDate = today();
    const existing = await this.repo.findOne({
      where: { employeeId: data.employeeId, workDate },
    });
    if (existing?.checkInAt) {
      throw new BadRequestException('Already checked in today');
    }

    let record: Attendance =
      existing ?? this.repo.create({ employeeId: data.employeeId, workDate });

    record.checkInAt = new Date();
    record.checkInPhoto = this.savePhoto(data.photo);
    record.checkInNote = data.note ?? record.checkInNote;
    record = await this.repo.save(record);
    return record;
  }

  async checkOut(data: CheckOutPayload) {
    const record = await this.repo.findOne({
      where: {
        employeeId: data.employeeId,
        workDate: today(),
        checkInAt: Not(IsNull()),
        checkOutAt: IsNull(),
      },
    });
    if (!record) {
      // The record may already have been closed automatically at the cutoff.
      // Treat that as a successful, idempotent checkout.
      const closed = await this.repo.findOne({
        where: {
          employeeId: data.employeeId,
          workDate: today(),
          checkInAt: Not(IsNull()),
          checkOutAt: Not(IsNull()),
        },
      });
      if (closed) return closed;

      throw new NotFoundException(
        'No open attendance for today. Please check in first.',
      );
    }

    record.checkOutAt = new Date();
    record.checkOutPhoto = this.savePhoto(data.photo);
    await this.repo.save(record);
    return record;
  }

  async today(employeeId: number): Promise<Attendance | null> {
    return this.repo.findOne({ where: { employeeId, workDate: today() } });
  }

  async list(q: AttendanceQuery) {
    const where: FindOptionsWhere<Attendance> = {};
    if (q.employeeId) where.employeeId = q.employeeId;
    if (q.from && q.to) where.workDate = Between(q.from, q.to);
    else if (q.from) where.workDate = q.from as string;
    else if (q.to) where.workDate = q.to as string;

    const rows = await this.repo.find({
      where,
      relations: ['employee'],
      order: { workDate: 'DESC', checkInAt: 'DESC' },
    });
    return rows.map((r) => ({
      ...r,
      employee: r.employee
        ? { ...r.employee, password: undefined }
        : undefined,
    }));
  }
}
