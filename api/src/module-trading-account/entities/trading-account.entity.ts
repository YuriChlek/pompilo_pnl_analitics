import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '@/module-user/entities/user.entity';
import { ApiKey } from '@/module-api-keys/entities/api-key.entity';
import { EXCHANGES, MARKET_TYPES } from '@/module-api-keys/enums/api-keys-enums';
import { FuturesClosedPnl } from '@/module-trades/entities/futures-closed-pnl.entity';

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

    @OneToMany(() => FuturesClosedPnl, futuresClosedPnl => futuresClosedPnl.tradingAccount)
    futuresClosedPnl: FuturesClosedPnl[];

    @Column({
        type: 'enum',
        enum: EXCHANGES,
    })
    exchange: EXCHANGES;

    @Column({
        type: 'varchar',
        name: 'exchange_user_account_id',
    })
    exchangeUserAccountId: string;

    @Column({
        type: 'enum',
        enum: MARKET_TYPES,
    })
    market: MARKET_TYPES;
}
