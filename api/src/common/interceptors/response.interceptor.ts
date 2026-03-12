import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { ResponseData } from '@/common/dto/response.dto';
import { map, Observable } from 'rxjs';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { Response } from 'express';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ResponseData<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler<T>,
    ): Observable<ResponseData<T>> | Promise<Observable<ResponseData<T>>> {
        const ctx: HttpArgumentsHost = context.switchToHttp();
        const response: Response = ctx.getResponse<Response>();

        return next.handle().pipe(map(data => this.formatSuccessResponse(data, response)));
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
}
