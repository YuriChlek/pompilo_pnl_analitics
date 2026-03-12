import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '@/module-auth/decorators/auth.decorator';
import { UserRoles } from '@/module-auth/enums/role.enum';
import { Request } from 'express';
import { AccessTokenPayload } from '@/module-auth-token/interfaces/auth-token.interfaces';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles: UserRoles[] = this.reflector.getAllAndOverride<UserRoles[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request: Request = context.switchToHttp().getRequest();
        const user = request?.user as AccessTokenPayload;
        const userRole: string | string[] = user.role;

        if (!user || !userRole) {
            throw new ForbiddenException('User not authorized.');
        }

        if (!requiredRoles.includes(user.role as UserRoles)) {
            throw new ForbiddenException(`Access denied.`);
        }

        return true;
    }
}
