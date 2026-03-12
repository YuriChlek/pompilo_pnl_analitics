import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { ResponseData } from '@/common/dto/response.dto';
import { catchError, map, Observable } from 'rxjs';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { Request, Response } from 'express';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ResponseData<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler<T>,
    ): Observable<ResponseData<T>> | Promise<Observable<ResponseData<T>>> {
        const ctx: HttpArgumentsHost = context.switchToHttp();
        const response: Response = ctx.getResponse<Response>();
        const request: Request = ctx.getRequest<Request>();

        return next.handle().pipe(
            map(data => this.formatSuccessResponse(data, response)),
            catchError(error => this.formatErrorResponse(error, request)),
        );
    }

    private formatSuccessResponse(data: T, response: Response): ResponseData<T> {
        const statusCode: number = response.statusCode;

        return {
            success: true,
            statusCode,
            data,
            timestamp: new Date().toISOString(),
        };
    }

    private formatErrorResponse(err: any, request: Request): Observable<ResponseData<T>> {
        const error = err as { status?: number; message?: string; response?: { message?: string } };
        const statusCode: number = error?.status ?? 500;

        return new Observable(observer => {
            observer.next({
                success: false,
                statusCode,
                message: error.message,
                error: error?.response?.message,
                timestamp: new Date().toISOString(),
                path: request.url,
            });
            observer.complete();
        });
    }
}
