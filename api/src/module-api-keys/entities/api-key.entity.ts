import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '@/module-user/entities/user.entity';
import { CONNECTION_STATUS, EXCHANGES, MARKET_TYPES } from '@/module-api-keys/enums/api-keys.enums';
import { Exclude } from 'class-transformer';

@Entity({ name: 'api_keys' })
export class ApiKey {
    @PrimaryGeneratedColumn('uuid', { name: 'api_key_id' })
    id: string;

    @Column({ name: 'user_id' })
    userId: string;

    @ManyToOne(() => User, user => user.apiKeys, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({
        type: 'text',
        name: 'api_key',
        unique: true,
    })
    apiKey: string;

    @Column({
        type: 'text',
        name: 'secret_key',
        unique: true,
    })
    @Exclude()
    secretKey: string;

    @Column({
        type: 'enum',
        name: 'exchange',
        enum: EXCHANGES,
    })
    exchange: EXCHANGES;

    @Column({
        type: 'enum',
        name: 'connection_status',
        enum: CONNECTION_STATUS,
        default: CONNECTION_STATUS.CONNECTED,
    })
    connectionStatus: CONNECTION_STATUS;

    @Column({
        type: 'enum',
        name: 'market',
        enum: MARKET_TYPES,
    })
    market: MARKET_TYPES;

    @Column({
        type: 'varchar',
        name: 'exchange_user_account_id',
    })
    exchangeUserAccountId: string;

    @Column({
        type: 'text',
        name: 'api_key_name',
    })
    apiKeyName: string;

    @Column({
        type: 'boolean',
        name: 'is_active',
        default: true,
    })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
