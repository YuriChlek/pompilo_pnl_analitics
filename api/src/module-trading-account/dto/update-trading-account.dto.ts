import { PartialType } from '@nestjs/swagger';
import { CreateTradingAccountDto } from './create-trading-account.dto';

export class UpdateTradingAccountDto extends PartialType(CreateTradingAccountDto) {}
