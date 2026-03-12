import { Controller, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { ApiKeysService } from './services/api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import type { Request } from 'express';
import { Authorisation } from '@/module-auth/decorators/auth.decorator';
import { UserRoles } from '@/module-auth/enums/role.enum';

@Controller()
export class ApiKeysController {
    constructor(private readonly apiKeysService: ApiKeysService) {}

    @Post('create')
    @Authorisation(UserRoles.CUSTOMER)
    create(@Req() request: Request, @Body() createApiKeyDto: CreateApiKeyDto) {
        return this.apiKeysService.create(request, createApiKeyDto);
    }

    @Post('user-api-keys')
    @Authorisation(UserRoles.CUSTOMER)
    getUserApiKeys(@Req() request: Request) {
        return this.apiKeysService.getUserApiKeys(request);
    }

    @Patch('update/:id')
    @Authorisation(UserRoles.CUSTOMER)
    update(@Param('id') id: string, @Body() updateApiKeyDto: UpdateApiKeyDto) {
        return this.apiKeysService.update(+id, updateApiKeyDto);
    }

    @Delete('remove/:id')
    @Authorisation(UserRoles.CUSTOMER)
    remove(@Param('id') id: string) {
        return this.apiKeysService.remove(+id);
    }
}
