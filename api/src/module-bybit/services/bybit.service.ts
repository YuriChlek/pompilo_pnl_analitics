import { HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ApiValidationInterface } from '@/module-api-keys/types/api-keys.types';
import { TradesRepositoryService } from '@/module-trades/services/trades-repository.service';
import { EXCHANGES, MARKET_TYPES } from '@/module-api-keys/enums/api-keys.enums';
import { FuturesClosedPnl } from '@/module-trades/entities/futures-closed-pnl.entity';
import { BybitApiService } from '@/module-bybit/services/bybit-api.service';

@Injectable()
export class BybitService {
    private static readonly MAX_RANGE_MS = 7 * 24 * 60 * 60 * 1000;
    private static readonly MAX_LOOKBACK_MS = 2 * 365 * 24 * 60 * 60 * 1000;

    constructor(
        private readonly bybitApiService: BybitApiService,
        private readonly bybitRepositoryService: TradesRepositoryService,
    ) {}

    async getTradingPnl(
        exchange: EXCHANGES.BYBIT | EXCHANGES.BYBIT_DEMO,
        apiKey: string,
        secret: string,
        category: MARKET_TYPES,
        _lastTradeTime: string | null,
    ): Promise<FuturesClosedPnl[]> {
        const now = Date.now();
        let endTime = now;
        const allResults: FuturesClosedPnl[] = [];

        while (true) {
            const startTime = endTime - BybitService.MAX_RANGE_MS;
            const windowTrades = await this.fetchWindowTrades(
                exchange,
                apiKey,
                secret,
                category,
                startTime,
                endTime,
            );

            if (!windowTrades.length) {
                break;
            }

            allResults.push(...windowTrades);
            endTime = startTime;

            if (endTime < now - BybitService.MAX_LOOKBACK_MS) {
                break;
            }
        }
        console.log(allResults);
        return allResults;
    }

    async savePnl(data: FuturesClosedPnl[], tradingAccountId: string) {
        try {
            const closedPnlData = data.map(item => ({
                ...item,
                tradingAccountId,
            }));

            return await this.bybitRepositoryService.saveClosedPnl(closedPnlData);
        } catch (error) {
            this.handleUnexpectedError(error, 'Failed to save Bybit PnL data');
        }
    }

    async validateApiKey(
        exchange: EXCHANGES.BYBIT | EXCHANGES.BYBIT_DEMO,
        apiKey: string,
        secret: string,
    ): Promise<ApiValidationInterface | undefined> {
        const data = await this.bybitApiService.queryApiKey(exchange, apiKey, secret);

        if ('retCode' in data && Number(data['retCode']) === 0) {
            return {
                valid: true,
                exchangeUserAccountId: data.result.userID,
            };
        }
    }

    private async fetchWindowTrades(
        exchange: EXCHANGES.BYBIT | EXCHANGES.BYBIT_DEMO,
        apiKey: string,
        secret: string,
        category: MARKET_TYPES,
        startTime: number,
        endTime: number,
    ): Promise<FuturesClosedPnl[]> {
        const trades: FuturesClosedPnl[] = [];
        let cursor: string | undefined;

        do {
            const data = await this.bybitApiService.getClosedPnlPage(
                exchange,
                apiKey,
                secret,
                category,
                startTime,
                endTime,
                cursor,
            );

            if (data.retCode !== 0) {
                throw new HttpException(data.retMsg, 400);
            }

            const pageTrades = data.result?.list ?? [];

            trades.push(...pageTrades);
            cursor = data.result?.nextPageCursor ?? undefined;
        } while (cursor);

        return trades;
    }

    private handleUnexpectedError(error: unknown, message: string): never {
        if (error instanceof HttpException) {
            throw error;
        }

        throw new InternalServerErrorException(message);
    }
}
