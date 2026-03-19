import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/module-auth/guards/jwt-auth.guard';
import { USER_ROLES } from '@/module-auth/enums/auth-enums';
import { RolesGuard } from '@/module-auth/guards/roles.guard';
export const ROLES_KEY = 'roles';

export const Authorisation = (...roles: USER_ROLES[]) => {
    return applyDecorators(SetMetadata(ROLES_KEY, roles), UseGuards(JwtAuthGuard, RolesGuard));
};
