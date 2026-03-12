import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '@/module-user/entities/user.entity';
import { ApiKey } from '@/module-api-keys/entities/api-key.entity';
import { Exchanges, MarketTypes } from '@/module-api-keys/enums';

@Entity({ name: 'trading_account' })
export class TradingAccount {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', name: 'trading_account_name' })
    tradingAccountName: string;

    @Column({ name: 'user_id' })
    userId: string;

    @ManyToOne(() => User, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => ApiKey, {
        onDelete: 'CASCADE',
        nullable: false,
    })
    @JoinColumn({ name: 'api_key_id' })
    apiKey: ApiKey;

    @Column({
        type: 'enum',
        enum: Exchanges,
    })
    exchange: Exchanges;

    @Column({
        type: 'varchar',
        name: 'exchange_user_account_id',
    })
    exchangeUserAccountId: string;

    @Column({
        type: 'enum',
        enum: MarketTypes,
    })
    market: MarketTypes;
}
