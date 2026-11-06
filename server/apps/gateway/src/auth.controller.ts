import { Body, Controller, ForbiddenException, HttpCode, Post, UnauthorizedException, UseGuards, UseInterceptors, UploadedFile, Get, Req, BadRequestException, HttpException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Inject, NotImplementedException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MSG } from '@app/common';
import { LoginDto } from '@app/common';
import { ChangePasswordDto } from '@app/common';
import { JwtAuthGuard, AuthPayload } from './guards';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_CLIENT') private readonly authClient: ClientProxy,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    const res = await firstValueFrom(this.authClient.send(MSG.AUTH_LOGIN, dto).pipe(
      catchError((err: { statusCode?: number; message?: string }) => {
        const status = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        const mapped =
          status === 401
            ? new UnauthorizedException(err?.message ?? 'Invalid credentials')
            : status === 403
              ? new ForbiddenException(err?.message ?? 'Forbidden')
              : new HttpException(err?.message ?? 'Internal server error', status);
        throw mapped;
      }),
    ));
    if (dto.portal === 'admin' && res.employee?.role !== 'admin') {
      throw new ForbiddenException('Akun ini bukan Admin HRD');
    }
    return res;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: { user: AuthPayload }) {
    return req.user;
  }

  @Post('change-password')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Req() req: { user: AuthPayload },
    @Body() dto: ChangePasswordDto,
  ) {
    await firstValueFrom(
      this.authClient
        .send(MSG.AUTH_CHANGE_PASSWORD, { id: req.user.sub, ...dto })
        .pipe(
          catchError((err: { statusCode?: number; message?: string }) => {
            const status =
              typeof err?.statusCode === 'number' ? err.statusCode : 500;
            throw new HttpException(err?.message ?? 'Internal server error', status);
          }),
        ),
    );
    return { ok: true };
  }
}
