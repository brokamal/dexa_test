import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export interface ConfigLike {
  get(key: string): string | undefined;
}

export function mysqlOptions(cs: ConfigLike, entities: Array<unknown> = []) {
  return {
    type: 'mysql' as const,
    host: cs.get('DB_HOST') ?? '127.0.0.1',
    port: Number(cs.get('DB_PORT') ?? 3306),
    username: cs.get('DB_USER') ?? 'absensi',
    password: cs.get('DB_PASS') ?? '',
    database: cs.get('DB_NAME') ?? 'absensi',
    dateStrings: true,
    entities,
    synchronize: true,
    logging: false,
  } as TypeOrmModuleOptions;
}
