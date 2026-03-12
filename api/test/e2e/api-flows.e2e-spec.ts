import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import type { Server } from 'http';
import type { App } from 'supertest/types';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';
import {
    E2ETestApplicationModule,
    FakeApiKeysService,
    FakeCustomerAuthService,
    FakeTradingAccountService,
    FakeUsersHttpService,
    TestingJwtAuthGuard,
} from './support/e2e-test.module';
import { UserRoles } from '@/module-auth/enums/role.enum';
import { COOKIE_NAMES } from '@/module-auth/constants/auth.constants';
import { Exchanges, MarketTypes } from '@/module-api-keys/enums';
import { JwtAuthGuard } from '@/module-auth/guards/jwt-auth.guard';
import { expectSuccessResponse, expectErrorResponse } from '../utils/request-helpers';

describe('Main API flows (e2e)', () => {
    let app: INestApplication;
    let httpServer: Server & App;
    let customerAuthService: FakeCustomerAuthService;
    let apiKeysService: FakeApiKeysService;
    let tradingAccountService: FakeTradingAccountService;
    let usersService: FakeUsersHttpService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [E2ETestApplicationModule],
        })
            .overrideGuard(JwtAuthGuard)
            .useClass(TestingJwtAuthGuard)
            .compile();

        app = moduleFixture.createNestApplication();
        app.use(cookieParser());
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                transform: true,
            }),
        );
        app.useGlobalInterceptors(new ResponseInterceptor());
        await app.init();
        httpServer = app.getHttpServer() as Server & App;
        customerAuthService = app.get<FakeCustomerAuthService>(FakeCustomerAuthService);
        apiKeysService = app.get<FakeApiKeysService>(FakeApiKeysService);
        tradingAccountService = app.get<FakeTradingAccountService>(FakeTradingAccountService);
        usersService = app.get<FakeUsersHttpService>(FakeUsersHttpService);
    });

    afterEach(() => {
        customerAuthService.reset();
        apiKeysService.reset();
        tradingAccountService.reset();
        usersService.reset();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Authentication flows', () => {
        it('registers a customer successfully', async () => {
            const payload = {
                name: 'Alice Trader',
                email: 'alice@example.com',
                password: 'Password1',
            };

            const res = await request(httpServer).post('/customer/register').send(payload);

            const body = expectSuccessResponse<{ id: string; email: string; role: UserRoles }>(
                res,
                201,
            );
            expect(typeof body.data.id).toBe('string');
            expect(body.data.email).toBe(payload.email);
            expect(body.data.role).toBe(UserRoles.CUSTOMER);
        });

        it('rejects duplicate registration attempts with a 409', async () => {
            const payload = {
                name: 'Bob Trader',
                email: 'bob@example.com',
                password: 'Password1',
            };

            await request(httpServer).post('/customer/register').send(payload).expect(201);
            const res = await request(httpServer).post('/customer/register').send(payload);

            expectErrorResponse(res, 409);
        });

        it('logins successfully with valid credentials', async () => {
            const loginPayload = {
                login: 'existing@example.com',
                password: 'Password1',
                role: UserRoles.CUSTOMER,
            };

            const res = await request(httpServer).post('/customer/login').send(loginPayload);

            const body = expectSuccessResponse<{ id: string; email: string; role: UserRoles }>(
                res,
                201,
            );
            expect(typeof body.data.id).toBe('string');
            expect(body.data.email).toBe(loginPayload.login);
            expect(body.data.role).toBe(UserRoles.CUSTOMER);
        });

        it('fails login with invalid credentials', async () => {
            const payload = {
                login: 'missing@example.com',
                password: 'Password1',
                role: UserRoles.CUSTOMER,
            };

            const res = await request(httpServer).post('/customer/login').send(payload);

            const body = expectErrorResponse(res, 401);
            expect(body.message).toBe('Login or password is not valid.');
        });

        it('refreshes tokens when refresh cookie is valid', async () => {
            const res = await request(httpServer)
                .post('/customer/refresh')
                .set('Cookie', [`${COOKIE_NAMES.CUSTOMER_REFRESH_TOKEN}=valid-refresh`]);

            const body = expectSuccessResponse<boolean>(res, 201);
            expect(body.data).toBe(true);
        });

        it('rejects refresh attempts when refresh cookie is invalid', async () => {
            const res = await request(httpServer)
                .post('/customer/refresh')
                .set('Cookie', [`${COOKIE_NAMES.CUSTOMER_REFRESH_TOKEN}=expired-refresh`]);

            expectErrorResponse(res, 401);
        });

        it('grants access to protected routes when auth header is present', async () => {
            const payload = {
                apiKey: 'ABCDEFGHIJKLMNOP',
                secretKey: 'SECRET123456789',
                exchange: Exchanges.BYBIT,
                market: MarketTypes.FUTURES,
                apiKeyName: 'Primary Key',
            };

            const res = await request(httpServer)
                .post('/customer/api-key/create')
                .set('x-test-auth', 'customer:user-1')
                .send(payload);

            const body = expectSuccessResponse<{ apiKey: string; exchange: Exchanges }>(res, 201);
            expect(body.data.apiKey).toMatch(/^\*\*\*....$/);
            expect(body.data.exchange).toBe(Exchanges.BYBIT);
        });

        it('denies access to protected routes without auth header', async () => {
            const payload = {
                apiKey: 'ABCDEFGHIJKLMNOP',
                secretKey: 'SECRET123456789',
                exchange: Exchanges.BYBIT,
                market: MarketTypes.FUTURES,
                apiKeyName: 'Primary Key',
            };

            const res = await request(httpServer).post('/customer/api-key/create').send(payload);

            expectErrorResponse(res, 401);
        });
    });

    describe('User flows', () => {
        it('returns user data by id', async () => {
            const res = await request(httpServer).get('/customer/users/user-1');

            const body = expectSuccessResponse<{ id: string; email: string }>(res, 200);
            expect(body.data).toMatchObject({
                id: 'user-1',
                email: 'primary@example.com',
            });
        });

        it('returns 404 when user is not found', async () => {
            const res = await request(httpServer).get('/customer/users/missing-user');

            expectErrorResponse(res, 404);
        });

        it('updates user successfully', async () => {
            const updatePayload = {
                name: 'Updated User',
                email: 'updated@example.com',
            };

            const res = await request(httpServer)
                .patch('/customer/users/user-1')
                .send(updatePayload);

            const body = expectSuccessResponse<{ name: string; email: string }>(res, 200);
            expect(body.data).toMatchObject(updatePayload);
        });

        it('prevents updating user with duplicate email', async () => {
            const updatePayload = {
                email: 'secondary@example.com',
            };

            const res = await request(httpServer)
                .patch('/customer/users/user-1')
                .send(updatePayload);

            expectErrorResponse(res, 409);
        });

        it('deletes user successfully', async () => {
            const res = await request(httpServer).delete('/customer/users/user-2');

            const body = expectSuccessResponse<{ id: string }>(res, 200);
            expect(body.data).toMatchObject({ id: 'user-2' });
        });

        it('returns 404 when deleting missing user', async () => {
            const res = await request(httpServer).delete('/customer/users/missing');

            expectErrorResponse(res, 404);
        });
    });

    describe('API key flows', () => {
        const apiKeyPayload = {
            apiKey: 'ABCDEFGHIJKLMNOP',
            secretKey: 'SECRET123456789',
            exchange: Exchanges.BYBIT,
            market: MarketTypes.FUTURES,
            apiKeyName: 'Main Futures',
        };

        it('creates api keys for authenticated users', async () => {
            const res = await request(httpServer)
                .post('/customer/api-key/create')
                .set('x-test-auth', 'customer:user-1')
                .send(apiKeyPayload);

            const body = expectSuccessResponse<{ apiKey: string }>(res, 201);
            expect(body.data.apiKey).toMatch(/^\*\*\*/);
        });

        it('rejects api key creation when validation fails', async () => {
            const res = await request(httpServer)
                .post('/customer/api-key/create')
                .set('x-test-auth', 'customer:user-1')
                .send({ ...apiKeyPayload, apiKey: 'fail-validation' });

            const body = expectErrorResponse(res, 400);
            expect(body.message).toBe('Api key validation failed.');
        });

        it('returns stored api keys for the authenticated user', async () => {
            await request(httpServer)
                .post('/customer/api-key/create')
                .set('x-test-auth', 'customer:user-1')
                .send(apiKeyPayload)
                .expect(201);

            const res = await request(httpServer)
                .post('/customer/api-key/user-api-keys')
                .set('x-test-auth', 'customer:user-1');

            const body = expectSuccessResponse<Array<{ apiKeyName: string }>>(res, 201);
            expect(Array.isArray(body.data)).toBe(true);
            expect(body.data[0]).toMatchObject({
                apiKeyName: 'Default',
            });
        });
    });

    describe('Trading account flows', () => {
        const basePayload = {
            tradingAccountName: 'Primary Account',
            apiKeyId: '118d866c-048f-4710-be77-a9ab672456c4',
            exchange: Exchanges.BYBIT,
            market: MarketTypes.FUTURES,
        };

        it('creates trading accounts when API key is active', async () => {
            const res = await request(httpServer)
                .post('/customer/trading-account/create')
                .set('x-test-auth', 'customer:user-1')
                .send(basePayload);

            const body = expectSuccessResponse<{ tradingAccountName: string }>(res, 201);
            expect(body.data).toMatchObject({
                tradingAccountName: basePayload.tradingAccountName,
            });
        });

        it('returns 400 when api key is inactive', async () => {
            const res = await request(httpServer)
                .post('/customer/trading-account/create')
                .set('x-test-auth', 'customer:user-1')
                .send({
                    ...basePayload,
                    apiKeyId: '00000000-0000-0000-0000-000000000000',
                });

            const body = expectErrorResponse(res, 400);
            expect(body.message).toBe('Provided API key is not active.');
        });

        it('returns sanitized 500 errors on unexpected failures', async () => {
            const res = await request(httpServer)
                .post('/customer/trading-account/create')
                .set('x-test-auth', 'customer:user-1')
                .send({
                    ...basePayload,
                    tradingAccountName: 'boom',
                });

            const body = expectErrorResponse(res, 500);
            expect(body.message).toBe('Failed to create trading account');
        });
    });
});
