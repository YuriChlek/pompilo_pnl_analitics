import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

export class JwtAuthGuard extends AuthGuard(['admin-jwt', 'customer-jwt']) {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        return super.canActivate(context);
    }
}
