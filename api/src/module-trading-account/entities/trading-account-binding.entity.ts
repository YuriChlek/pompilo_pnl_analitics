import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { TradingAccount } from '@/module-trading-account/entities/trading-account.entity';
import { ApiKey } from '@/module-api-keys/entities/api-key.entity';

@Entity({ name: 'trading_account_binding' })
@Index(['tradingAccountId'], { unique: true })
@Index(['apiKeyId'], { unique: true })
export class TradingAccountBinding {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'trading_account_id' })
    tradingAccountId: string;

    @ManyToOne(() => TradingAccount, {
        onDelete: 'CASCADE',
        nullable: false,
    })
    @JoinColumn({ name: 'trading_account_id' })
    tradingAccount: TradingAccount;

    @Column({ name: 'api_key_id' })
    apiKeyId: string;

    @ManyToOne(() => ApiKey, {
        onDelete: 'CASCADE',
        nullable: false,
    })
    @JoinColumn({ name: 'api_key_id' })
    apiKey: ApiKey;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
