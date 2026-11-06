import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

export interface AuthPayload {
  sub: number;
  nip: string;
  name: string;
  role: 'employee' | 'admin';
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header = req.headers['authorization'] ?? '';
    const token = header.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException('Missing bearer token');

    try {
      req.user = this.jwt.verify<AuthPayload>(token);
      return true;
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

const ROLE_KEY = 'roles';

export const Roles = (...roles: Array<'employee' | 'admin'>) =>
  SetMetadata(ROLE_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<
      Array<'employee' | 'admin'>
    >(ROLE_KEY, [context.getHandler(), context.getClass()]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user as AuthPayload | undefined;
    if (!user) throw new UnauthorizedException();
    if (!required.includes(user.role)) {
      throw new UnauthorizedException('Insufficient role');
    }
    return true;
  }
}
