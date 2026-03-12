import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AdminAuthModule } from '@/module-admin-auth/admin-auth.module';

@Module({
    imports: [
        AdminAuthModule,
        RouterModule.register([
            {
                path: 'admin',
                children: [
                    {
                        path: '',
                        module: AdminAuthModule,
                    },
                ],
            },
        ]),
    ],
})
export class AdminFrontendModule {}
