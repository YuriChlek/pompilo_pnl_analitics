import type request from 'supertest';

export type SuccessEnvelope<T> = {
    success: true;
    statusCode: number;
    timestamp: string;
    data: T;
};

export type ErrorEnvelope = {
    statusCode: number;
    error: string;
    message?: string;
};

export const expectSuccessResponse = <T>(
    res: request.Response,
    status: number,
): SuccessEnvelope<T> => {
    expect(res.status).toBe(status);
    const body = res.body as SuccessEnvelope<T>;
    expect(body).toMatchObject({
        success: true,
        statusCode: status,
    });
    expect(typeof body.timestamp).toBe('string');
    return body;
};

export const expectErrorResponse = (res: request.Response, status: number): ErrorEnvelope => {
    expect(res.status).toBe(status);
    const body = res.body as ErrorEnvelope;
    expect(body.statusCode).toBe(status);
    expect(typeof body.error).toBe('string');
    return body;
};
