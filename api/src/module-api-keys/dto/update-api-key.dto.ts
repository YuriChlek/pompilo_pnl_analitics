import { PartialType } from '@nestjs/mapped-types';
import { CreateApiKeyDto } from '@/module-api-keys/dto/create-api-key.dto';

export class UpdateApiKeyDto extends PartialType(CreateApiKeyDto) {}
