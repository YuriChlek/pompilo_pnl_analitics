import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import type { StringValue } from 'ms';
import { EXCHANGES, MARKET_TYPES } from '@/module-api-keys/enums/api-keys.enums';
import {
    BybitApiKeyInfo,
    BybitClosedPnlResult,
    BybitQueryApiResponse,
} from '@/module-bybit/interfaces/bybit-exchange.interfaces';

@Injectable()
export class BybitApiService {
    private readonly bybitUrl: StringValue;
    private readonly bybitDemoUrl: StringValue;

    constructor(private readonly configService: ConfigService) {
        this.bybitUrl = this.configService.getOrThrow<StringValue>('BYBIT_URL');
        this.bybitDemoUrl = this.configService.getOrThrow<StringValue>('BYBIT_DEMO_URL');
    }

    async getClosedPnlPage(
        exchange: EXCHANGES.BYBIT | EXCHANGES.BYBIT_DEMO,
        apiKey: string,
        secret: string,
        category: MARKET_TYPES,
        startTime: number,
        endTime: number,
        cursor?: string,
    ): Promise<BybitQueryApiResponse<BybitClosedPnlResult>> {
        const recvWindow = '20000';
        const queryParams = new URLSearchParams({
            category,
            startTime: startTime.toString(),
            endTime: endTime.toString(),
            limit: '200',
        });

        if (cursor) {
            queryParams.set('cursor', cursor);
        }

        return await this.get<BybitClosedPnlResult>(
            exchange,
            '/v5/position/closed-pnl',
            apiKey,
            secret,
            recvWindow,
            queryParams,
        );
    }

    async queryApiKey(
        exchange: EXCHANGES.BYBIT | EXCHANGES.BYBIT_DEMO,
        apiKey: string,
        secret: string,
    ): Promise<BybitQueryApiResponse<BybitApiKeyInfo>> {
        return await this.get<BybitApiKeyInfo>(
            exchange,
            '/v5/user/query-api',
            apiKey,
            secret,
            '5000',
        );
    }

    private async get<TResponse>(
        exchange: EXCHANGES.BYBIT | EXCHANGES.BYBIT_DEMO,
        path: string,
        apiKey: string,
        secret: string,
        recvWindow: string,
        queryParams?: URLSearchParams,
    ): Promise<BybitQueryApiResponse<TResponse>> {
        const queryString = queryParams?.toString() ?? '';
        const timestamp = Date.now().toString();
        const signature = this.generateSignature(timestamp, apiKey, recvWindow, queryString, secret);
        const endpoint = this.buildEndpoint(exchange, path, queryString);
        const response = await this.fetchJson(endpoint, apiKey, signature, timestamp, recvWindow);
        const data = (await response.json()) as BybitQueryApiResponse<TResponse>;

        if (!response.ok) {
            throw new HttpException(data, response.status);
        }

        return data;
    }

    private buildEndpoint(
        exchange: EXCHANGES.BYBIT | EXCHANGES.BYBIT_DEMO,
        path: string,
        queryString: string,
    ): string {
        const baseUrl = exchange === EXCHANGES.BYBIT_DEMO ? this.bybitDemoUrl : this.bybitUrl;

        return queryString ? `${baseUrl}${path}?${queryString}` : `${baseUrl}${path}`;
    }

    private generateSignature(
        timestamp: string,
        apiKey: string,
        recvWindow: string,
        queryString: string,
        secret: string,
    ): string {
        const payload = timestamp + apiKey + recvWindow + queryString;

        return crypto.createHmac('sha256', secret).update(payload).digest('hex');
    }

    private async fetchJson(
        endpoint: string,
        apiKey: string,
        signature: string,
        timestamp: string,
        recvWindow: string,
    ): Promise<Response> {
        return await fetch(endpoint, {
            method: 'GET',
            headers: {
                'X-BAPI-API-KEY': apiKey,
                'X-BAPI-SIGN': signature,
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recvWindow,
            },
        });
    }
}
