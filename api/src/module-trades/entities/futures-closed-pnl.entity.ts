import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TradingAccount } from '@/module-trading-account/entities/trading-account.entity';

@Entity({ name: 'futures_closed_pnl' })
export class FuturesClosedPnl {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ name: 'trading_account_id' })
    tradingAccountId: string;

    @ManyToOne(() => TradingAccount, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'trading_account_id' })
    tradingAccount: TradingAccount;

    @Column({ type: 'varchar', length: 20 })
    symbol: string;

    @Column({ type: 'varchar', length: 20 })
    orderType: string;

    @Column({ type: 'int' })
    leverage: number;

    @Column({ type: 'bigint' })
    updatedTime: string;

    @Column({ type: 'varchar', length: 10 })
    side: 'Buy' | 'Sell';

    @Index()
    @Column({ type: 'varchar', length: 100 })
    orderId: string;

    @Column({ type: 'decimal', precision: 18, scale: 8 })
    closedPnl: string;

    @Column({ type: 'decimal', precision: 18, scale: 8 })
    openFee: string;

    @Column({ type: 'decimal', precision: 18, scale: 8 })
    closeFee: string;

    @Column({ type: 'decimal', precision: 18, scale: 8 })
    avgEntryPrice: string;

    @Column({ type: 'decimal', precision: 18, scale: 8 })
    qty: string;

    @Column({ type: 'decimal', precision: 18, scale: 8 })
    cumEntryValue: string;

    @Column({ type: 'bigint' })
    createdTime: string;

    @Column({ type: 'decimal', precision: 18, scale: 8 })
    orderPrice: string;

    @Column({ type: 'decimal', precision: 18, scale: 8 })
    closedSize: string;

    @Column({ type: 'decimal', precision: 18, scale: 8 })
    avgExitPrice: string;

    @Column({ type: 'varchar', length: 50 })
    execType: string;

    @Column({ type: 'int' })
    fillCount: number;

    @Column({ type: 'decimal', precision: 18, scale: 8 })
    cumExitValue: string;
}
