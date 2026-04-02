import { IsIn, IsOptional } from 'class-validator';
import {
    ANALYTICS_PERIODS,
    DEFAULT_ANALYTICS_PERIOD,
} from '@/module-analyze/constants/analytics-periods';
import type { AnalyticsPeriod } from '@/module-analyze/types/analytics-period.types';

export class TradingAccountAnalyticsQueryDto {
    @IsOptional()
    @IsIn(ANALYTICS_PERIODS)
    period: AnalyticsPeriod = DEFAULT_ANALYTICS_PERIOD;
}
