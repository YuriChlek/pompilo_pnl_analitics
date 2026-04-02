import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { EXCHANGES, MARKET_TYPES } from '@/module-api-keys/enums/api-keys.enums';

export class CreateTradingAccountDto {
    @ApiProperty({
        description: 'Trading account display name',
        example: 'My Bybit Futures Account',
    })
    @IsString()
    @IsNotEmpty()
    tradingAccountName: string;

    @ApiProperty({
        description: 'API Key UUID',
        example: '118d866c-048f-4710-be77-a9ab672456c4',
        format: 'uuid',
    })
    @IsUUID()
    apiKeyId: string;

    @ApiProperty({
        description: 'Exchange name',
        enum: EXCHANGES,
        example: EXCHANGES.BYBIT,
    })
    @IsEnum(EXCHANGES)
    exchange: EXCHANGES;

    @ApiProperty({
        description: 'Market type',
        enum: MARKET_TYPES,
        example: MARKET_TYPES.FUTURES,
    })
    @IsEnum(MARKET_TYPES)
    market: MARKET_TYPES;
}
