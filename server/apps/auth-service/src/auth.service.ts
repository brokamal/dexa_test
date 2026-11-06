import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Employee, Role } from '@app/common';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Employee)
    private readonly employees: Repository<Employee>,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const emp = await this.employees
      .createQueryBuilder('e')
      .addSelect('e.password')
      .where('e.email = :email', { email })
      .getOne();

    if (!emp || !emp.isActive) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, emp.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const accessToken = await this.jwt.signAsync({
      sub: emp.id,
      nip: emp.nip,
      name: emp.fullName,
      role: emp.role,
    });

    return {
      accessToken,
      employee: {
        id: emp.id,
        nip: emp.nip,
        fullName: emp.fullName,
        email: emp.email,
        role: emp.role as Role | string,
        position: emp.position,
        department: emp.department,
        mustChangePassword: emp.mustChangePassword,
      },
    };
  }

  async changePassword(id: number, currentPassword: string, newPassword: string) {
    const emp = await this.employees
      .createQueryBuilder('e')
      .addSelect('e.password')
      .where('e.id = :id', { id })
      .getOne();

    if (!emp) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(currentPassword, emp.password);
    if (!ok) throw new BadRequestException('Password saat ini salah');

    emp.password = await bcrypt.hash(newPassword, 10);
    emp.mustChangePassword = false;
    await this.employees.save(emp);
    return { ok: true };
  }
}
