import { Injectable, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import * as crypto from 'crypto';
import {
    BybitApiKeyInfo,
    BybitClosedPnlResult,
    BybitQueryApiResponse,
} from '@/module-bybit/interfaces/bybit-exchange.interfaces';
import { ApiValidationInterface } from '@/module-api-keys/interfaces/api-keys.interfaces';
import { TradesRepositoryService } from '@/module-trades/services/trades-repository.service';
import { Exchanges, MarketTypes } from '@/module-api-keys/enums';
import { FuturesClosedPnl } from '@/module-trades/entities/futures-closed-pnl.entity';

@Injectable()
export class BybitService {
    private readonly BYBIT_URL: StringValue;
    private readonly BYBIT_DEMO_URL: StringValue;

    constructor(
        private readonly configService: ConfigService,
        private readonly bybitRepositoryService: TradesRepositoryService,
    ) {
        this.BYBIT_URL = this.configService.getOrThrow<StringValue>('BYBIT_URL');
        this.BYBIT_DEMO_URL = this.configService.getOrThrow<StringValue>('BYBIT_DEMO_URL');
    }

    async getTradingPnl(
        exchange: Exchanges.BYBIT | Exchanges.BYBIT_DEMO,
        apiKey: string,
        secret: string,
        category: MarketTypes,
        lastTradeTime: string | null,
    ): Promise<FuturesClosedPnl[]> {
        const bybitUrl = exchange === Exchanges.BYBIT_DEMO ? this.BYBIT_DEMO_URL : this.BYBIT_URL;
        const endpoint = `${bybitUrl}/v5/position/closed-pnl`;
        const recvWindow = '20000';

        const MAX_RANGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
        const now = Date.now();

        let endTime = now;
        console.log(lastTradeTime);

        const allResults: FuturesClosedPnl[] = [];

        while (true) {
            const startTime = endTime - MAX_RANGE_MS;

            const queryParams = new URLSearchParams({
                category,
                startTime: startTime.toString(),
                endTime: endTime.toString(),
                limit: '200',
            });

            const timestamp = Date.now().toString();
            const queryString = queryParams.toString();

            const signature = this.generateSignature(
                timestamp,
                apiKey,
                recvWindow,
                queryString,
                secret,
            );
            const queryEndpoint = `${endpoint}?${queryString}`;

            const response = await this.fetchBybitData(
                queryEndpoint,
                apiKey,
                signature,
                timestamp,
                recvWindow,
            );

            const data = (await response.json()) as BybitQueryApiResponse<BybitClosedPnlResult>;

            if (data.retCode !== 0) {
                throw new HttpException(data.retMsg, response.status);
            }

            if (!data.result?.list?.length) {
                break;
            }

            allResults.push(...data.result.list);

            endTime = startTime;

            if (endTime < now - 2 * 365 * 24 * 60 * 60 * 1000) {
                break;
            }
        }

        return allResults;
    }

    async savePnl(data: FuturesClosedPnl[], tradingAccountId: string) {
        try {
            const closedPnlData = data.map(item => {
                item.tradingAccountId = tradingAccountId;

                return item;
            });

            return await this.bybitRepositoryService.saveClosedPnl(closedPnlData);
        } catch (error) {
            console.error(error);
        }
    }

    async validateApiKey(
        exchange: Exchanges.BYBIT | Exchanges.BYBIT_DEMO,
        apiKey: string,
        secret: string,
    ): Promise<ApiValidationInterface | undefined> {
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        const queryString = '';
        const bybitUrl = exchange === Exchanges.BYBIT_DEMO ? this.BYBIT_DEMO_URL : this.BYBIT_URL;
        const endpoint = `${bybitUrl}/v5/user/query-api`;

        const signature = this.generateSignature(
            timestamp,
            apiKey,
            recvWindow,
            queryString,
            secret,
        );

        const response: Response = await this.fetchBybitData(
            endpoint,
            apiKey,
            signature,
            timestamp,
            recvWindow,
        );

        const data = (await response.json()) as unknown as BybitQueryApiResponse<BybitApiKeyInfo>;

        if (!response.ok) {
            throw new HttpException(data, response.status);
        }

        if ('retCode' in data && Number(data['retCode']) === 0) {
            return {
                valid: true,
                exchangeUserAccountId: data.result.userID,
            };
        }
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

    private async fetchBybitData(
        endpoint: string,
        apiKey: string,
        signature: string,
        timestamp: string,
        recvWindow: string,
    ): Promise<Response> {
        return await fetch(`${endpoint}`, {
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
