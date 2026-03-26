import { BadRequestException } from '@nestjs/common';
import type { ExecutionContext, CallHandler } from '@nestjs/common';
import type { Response, Request } from 'express';
import { Observable, of, throwError, lastValueFrom } from 'rxjs';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';
import { ResponseData } from '@/common/dto/response.dto';

const createExecutionContext = (): ExecutionContext =>
    ({
        switchToHttp: () => ({
            getResponse: () =>
                ({
                    statusCode: 200,
                }) as Response,
            getRequest: () =>
                ({
                    url: '/test',
                }) as Request,
        }),
    }) as ExecutionContext;

describe('ResponseInterceptor', () => {
    let interceptor: ResponseInterceptor<unknown>;
    let context: ExecutionContext;

    beforeEach(() => {
        interceptor = new ResponseInterceptor();
        context = createExecutionContext();
    });

    it('wraps successful responses with metadata', async () => {
        const handler: CallHandler = {
            handle: () => of({ message: 'ok' }),
        };

        const result = await lastValueFrom(
            interceptor.intercept(context, handler) as Observable<ResponseData<unknown>>,
        );

        expect(result).toMatchObject({
            success: true,
            statusCode: 200,
            data: { message: 'ok' },
        });
        expect((result as ResponseData<unknown>).timestamp).toBeDefined();
    });

    it('propagates thrown exceptions without mutating them', async () => {
        const handler: CallHandler = {
            handle: () => throwError(() => new BadRequestException('Invalid')),
        };

        await expect(
            lastValueFrom(
                interceptor.intercept(context, handler) as Observable<ResponseData<unknown>>,
            ),
        ).rejects.toBeInstanceOf(BadRequestException);
    });
});
