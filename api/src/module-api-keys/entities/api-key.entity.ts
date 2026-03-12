import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '@/module-user/entities/user.entity';
import { ConnectionStatus, Exchanges, MarketTypes } from '@/module-api-keys/enums';
import { Exclude } from 'class-transformer';
import { TradingAccount } from '@/module-trading-account/entities/trading-account.entity';

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
        enum: Exchanges,
    })
    exchange: Exchanges;

    @Column({
        type: 'enum',
        name: 'connection_status',
        enum: ConnectionStatus,
        default: ConnectionStatus.CONNECTED,
    })
    connectionStatus: ConnectionStatus;

    @Column({
        type: 'enum',
        name: 'market',
        enum: MarketTypes,
    })
    market: MarketTypes;

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

    @OneToMany(() => TradingAccount, acc => acc.apiKey)
    tradingAccount: TradingAccount[];
}
