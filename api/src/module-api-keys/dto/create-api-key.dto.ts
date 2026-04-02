import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EXCHANGES, MARKET_TYPES } from '@/module-api-keys/enums/api-keys.enums';
import { IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateApiKeyDto {
    @ApiProperty({
        description: 'Public API key provided by the exchange',
        example: 'AbCdEfGhIjKlMnOpQrStUvWxYz123456',
    })
    @IsString({ message: 'Api key must be a string.' })
    @IsNotEmpty({ message: 'Api key is required.' })
    @Length(5, 255, { message: 'Api key must be between 5 and 255 characters.' })
    apiKey: string;

    @ApiProperty({
        description: 'Secret key provided by the exchange',
        example: 'XyZ1234567890SecretKeyExample',
    })
    @IsString({ message: 'Secret key must be a string.' })
    @IsNotEmpty({ message: 'Secret key is required.' })
    @Length(5, 255, { message: 'Secret key must be between 5 and 255 characters.' })
    secretKey: string;

    @ApiProperty({
        description: 'Exchange name',
        example: 'bybit',
    })
    @IsNotEmpty({ message: 'Exchange is required.' })
    @IsEnum(EXCHANGES, {
        message: `Exchange must be one of: ${Object.values(EXCHANGES).join(', ')}`,
    })
    exchange: EXCHANGES;

    @ApiProperty({
        description: 'Market type',
        example: MARKET_TYPES.FUTURES,
    })
    @IsNotEmpty({ message: 'Market is required.' })
    @IsEnum(MARKET_TYPES, {
        message: `Market must be one of: ${Object.values(MARKET_TYPES).join(', ')}`,
    })
    market: MARKET_TYPES;

    @ApiPropertyOptional({
        description: 'Custom account name for identification',
        example: 'Main Futures Account',
    })
    apiKeyName: string;
}
