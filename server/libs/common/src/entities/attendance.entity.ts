import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Employee } from './employee.entity';

@Entity('attendances')
@Index(['employeeId', 'workDate'], { unique: true })
export class Attendance {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'employee_id', type: 'int' })
  employeeId!: number;

  @ManyToOne(() => Employee, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'employee_id' })
  employee!: Employee;

  @Column({ name: 'work_date', type: 'date' })
  workDate!: string;

  @Column({ name: 'check_in_at', type: 'datetime', nullable: true })
  checkInAt!: Date | null;

  @Column({ name: 'check_in_photo', type: 'varchar', length: 255, nullable: true })
  checkInPhoto!: string | null;

  @Column({ name: 'check_in_note', type: 'varchar', length: 255, nullable: true })
  checkInNote!: string | null;

  @Column({ name: 'check_out_at', type: 'datetime', nullable: true })
  checkOutAt!: Date | null;

  @Column({ name: 'check_out_photo', type: 'varchar', length: 255, nullable: true })
  checkOutPhoto!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;
}
