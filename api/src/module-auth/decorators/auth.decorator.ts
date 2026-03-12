import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/module-auth/guards/jwt-auth.guard';
import { UserRoles } from '@/module-auth/enums/role.enum';
import { RolesGuard } from '@/module-auth/guards/roles.guard';
export const ROLES_KEY = 'roles';

export const Authorisation = (...roles: UserRoles[]) => {
    return applyDecorators(SetMetadata(ROLES_KEY, roles), UseGuards(JwtAuthGuard, RolesGuard));
};
