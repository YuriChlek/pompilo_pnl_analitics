import { Controller, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { ApiKeysService } from './services/api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import type { Request } from 'express';
import { Authorisation } from '@/module-auth/decorators/auth.decorator';
import { USER_ROLES } from '@/module-auth/enums/auth-enums';

@Controller()
export class ApiKeysController {
    constructor(private readonly apiKeysService: ApiKeysService) {}

    @Post('create')
    @Authorisation(USER_ROLES.CUSTOMER)
    create(@Req() request: Request, @Body() createApiKeyDto: CreateApiKeyDto) {
        return this.apiKeysService.create(request, createApiKeyDto);
    }

    @Post('user-api-keys')
    @Authorisation(USER_ROLES.CUSTOMER)
    getUserApiKeys(@Req() request: Request) {
        return this.apiKeysService.getUserApiKeys(request);
    }

    @Patch('update/:id')
    @Authorisation(USER_ROLES.CUSTOMER)
    update(
        @Req() request: Request,
        @Param('id') id: string,
        @Body() updateApiKeyDto: UpdateApiKeyDto,
    ) {
        return this.apiKeysService.update(request, id, updateApiKeyDto);
    }

    @Delete('remove/:id')
    @Authorisation(USER_ROLES.CUSTOMER)
    remove(@Param('id') apiKeyId: string) {
        return this.apiKeysService.remove(apiKeyId);
    }
}
