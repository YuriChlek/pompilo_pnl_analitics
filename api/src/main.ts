import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { ValidationPipe } from '@nestjs/common';
import { setupSwagger } from '@/common/utils/setup-swagger.util';
import cookieParser from 'cookie-parser';

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule);

    app.use(cookieParser());
    app.enableCors({
        origin: 'http://localhost:3001',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    app.useGlobalPipes(new ValidationPipe());
    setupSwagger(app);
    await app.listen(3000);
}

bootstrap().catch((error: unknown) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
