import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exchanges, MarketTypes } from '@/module-api-keys/enums';
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
    @IsEnum(Exchanges, {
        message: `Exchange must be one of: ${Object.values(Exchanges).join(', ')}`,
    })
    exchange: Exchanges;

    @ApiProperty({
        description: 'Market type',
        example: MarketTypes.FUTURES,
    })
    @IsNotEmpty({ message: 'Market is required.' })
    @IsEnum(MarketTypes, {
        message: `Market must be one of: ${Object.values(MarketTypes).join(', ')}`,
    })
    market: MarketTypes;

    @ApiPropertyOptional({
        description: 'Custom account name for identification',
        example: 'Main Futures Account',
    })
    apiKeyName: string;
}
