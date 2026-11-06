import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RpcException } from '@nestjs/microservices';
import { catchError, throwError } from 'rxjs';
import { from } from 'rxjs';
import { LoginDto, MSG, ChangePasswordDto } from '@app/common';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @MessagePattern(MSG.AUTH_LOGIN)
  login(@Payload() dto: LoginDto) {
    return from(this.auth.login(dto.email, dto.password)).pipe(
      catchError((err) =>
        throwError(
          () =>
            new RpcException({
              statusCode: err.getStatus?.() ?? 500,
              message: err.message ?? 'Internal server error',
            }),
        ),
      ),
    );
  }

  @MessagePattern(MSG.AUTH_CHANGE_PASSWORD)
  changePassword(@Payload() dto: { id: number } & ChangePasswordDto) {
    return from(
      this.auth.changePassword(dto.id, dto.currentPassword, dto.newPassword),
    ).pipe(
      catchError((err) =>
        throwError(
          () =>
            new RpcException({
              statusCode: err.getStatus?.() ?? 500,
              message: err.message ?? 'Internal server error',
            }),
        ),
      ),
    );
  }
}
