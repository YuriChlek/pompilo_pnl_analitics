import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getTypeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => {
    return {
        type: 'postgres',
        host: configService.getOrThrow<string>('DB_HOST', 'localhost'),
        port: configService.getOrThrow<number>('DB_PORT'),
        username: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: configService.getOrThrow<string>('NODE_ENV') === 'development',
        extra: {
            max: 25,
        },
    };
};
