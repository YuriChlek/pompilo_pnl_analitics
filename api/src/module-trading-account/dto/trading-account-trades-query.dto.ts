import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { TradingAccountAnalyticsQueryDto } from '@/module-trading-account/dto/trading-account-analytics-query.dto';

export class TradingAccountTradesQueryDto extends TradingAccountAnalyticsQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(5)
    @Max(100)
    pageSize?: number;
}
