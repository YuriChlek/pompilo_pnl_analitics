import { IsIn, IsOptional } from 'class-validator';
import {
    ANALYTICS_PERIODS,
    DEFAULT_ANALYTICS_PERIOD,
    type AnalyticsPeriod,
} from '@/module-trades/constants/analytics-periods';

export class TradingAccountAnalyticsQueryDto {
    @IsOptional()
    @IsIn(ANALYTICS_PERIODS)
    period: AnalyticsPeriod = DEFAULT_ANALYTICS_PERIOD;
}
