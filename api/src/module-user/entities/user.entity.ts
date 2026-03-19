import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

import { USER_ROLES } from '@/module-auth/enums/auth-enums';
import { Token } from '@/module-auth-token/entities/auth-token.entity';
import { ApiKey } from '@/module-api-keys/entities/api-key.entity';

@Entity({ name: 'users' })
@Index(['name'])
@Index(['email'])
export class User {
    @PrimaryGeneratedColumn('uuid', { name: 'user_id' })
    id: string;

    @Column({ unique: true })
    name: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column({
        type: 'enum',
        name: 'role',
        enum: USER_ROLES,
        default: USER_ROLES.CUSTOMER,
    })
    role: USER_ROLES;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => Token, token => token.user, { cascade: true })
    tokens: Token[];

    @OneToMany(() => ApiKey, apiKey => apiKey.user, { cascade: true })
    apiKeys: ApiKey[];
}
