import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateTradingAccountDto {
    @ApiPropertyOptional({
        description: 'Trading account display name',
        example: 'My Bybit Futures Account',
    })
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    tradingAccountName?: string;

    @ApiPropertyOptional({
        description: 'API Key UUID',
        example: '118d866c-048f-4710-be77-a9ab672456c4',
        format: 'uuid',
    })
    @IsUUID()
    @IsOptional()
    apiKeyId?: string;
}
