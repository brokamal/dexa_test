import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { CreateEmployeeDto, Employee, Role, UpdateEmployeeDto } from '@app/common';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly repo: Repository<Employee>,
  ) {}

  list(search?: string) {
    const qb = this.repo
      .createQueryBuilder('e')
      .orderBy('e.createdAt', 'DESC');
    if (search) {
      qb.where('e.fullName LIKE :s OR e.nip LIKE :s OR e.email LIKE :s', {
        s: `%${search}%`,
      });
    }
    return qb.getMany();
  }

  async create(dto: CreateEmployeeDto) {
    await this.assertEmailAvailable(dto.email);
    const { nip: _ignored, ...rest } = dto;
    const password = await bcrypt.hash('password123', 10);

    // NIP is generated on the server. Retry a few times in case another
    // request created the same next sequence number concurrently.
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const saved = await this.repo.save({
          ...rest,
          nip: await this.nextNip(),
          role: (dto.role ?? Role.EMPLOYEE) as Role,
          isActive: dto.isActive ?? true,
          password,
          mustChangePassword: true,
        });
        return this.strip(saved);
      } catch (err) {
        if (attempt < 4 && this.isDuplicateEntry(err)) continue;
        throw err;
      }
    }

    throw new BadRequestException('Failed to generate NIP. Please try again.');
  }

  async update(id: number, dto: UpdateEmployeeDto) {
    const emp = await this.repo.findOne({ where: { id } });
    if (!emp) throw new NotFoundException('Employee not found');

    if (dto.nip || dto.email) {
      const dup = await this.repo.findOne({
        where: [
          ...(dto.nip ? [{ nip: dto.nip }] : []),
          ...(dto.email ? [{ email: dto.email }] : []),
        ],
      });
      if (dup && dup.id !== id) throw new BadRequestException('NIP or email already used');
    }

    const { password, ...rest } = dto;
    Object.assign(emp, rest);
    if (password) {
      emp.password = await bcrypt.hash(password, 10);
      emp.mustChangePassword = true;
    }

    return this.strip(await this.repo.save(emp));
  }

  private strip(emp: Employee) {
    const { password: _pw, ...clean } = emp;
    return clean;
  }

  private async assertEmailAvailable(email: string) {
    const dup = await this.repo.findOne({ where: { email } });
    if (dup) throw new BadRequestException('Email already registered');
  }

  private async nextNip() {
    const row = await this.repo
      .createQueryBuilder('e')
      .select('MAX(CAST(SUBSTRING(e.nip, 4) AS UNSIGNED))', 'max')
      .where('e.nip LIKE :prefix', { prefix: 'EMP%' })
      .getRawOne<{ max: string | number | null }>();
    const next = Number(row?.max ?? 0) + 1;
    return `EMP${String(next).padStart(3, '0')}`;
  }

  private isDuplicateEntry(err: unknown) {
    const e = err as { code?: string; driverError?: { code?: string } };
    return (e?.code ?? e?.driverError?.code) === 'ER_DUP_ENTRY';
  }
}
