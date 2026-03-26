import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { setupSwagger } from '@/common/utils/setup-swagger.util';
import cookieParser from 'cookie-parser';

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);
    const clientOrigin = configService.get<string>('CLIENT_ORIGIN', 'http://localhost:3001');
    const port = configService.get<number>('PORT', 3000);

    app.use(cookieParser());
    app.enableCors({
        origin: clientOrigin,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    app.useGlobalPipes(new ValidationPipe());
    setupSwagger(app);
    await app.listen(port);
}

bootstrap().catch((error: unknown) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
