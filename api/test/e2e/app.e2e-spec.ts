import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import type { App } from 'supertest/types';
import cookieParser from 'cookie-parser';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';
import { E2ETestApplicationModule } from './support/e2e-test.module';

describe('AppController (e2e)', () => {
    let app: INestApplication;
    let httpServer: Server & App;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [E2ETestApplicationModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.use(cookieParser());
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        app.useGlobalInterceptors(new ResponseInterceptor());
        await app.init();
        httpServer = app.getHttpServer() as Server & App;
    });

    afterAll(async () => {
        await app.close();
    });

    it('/ (GET)', async () => {
        const res = await request(httpServer).get('/');

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            success: true,
            statusCode: 200,
            data: 'Hello World!',
        });
    });
});
