import type {
    TradingAccount,
    TradingAccountChartPoint,
    TradingAccountRecentTrade,
    TradingAccountStatistic,
} from '@/features/module-trading-account/interfaces/trading-account.interfaces';
import type { TradingAccountAnalyticsPeriod } from '@/features/module-trading-account/types/analytics-period.types';

export type AccountStatisticProps = {
    statistics: TradingAccountStatistic;
};

export type StatisticDiagramProps = {
    chart: TradingAccountChartPoint[];
};

export type TradingAccountDetailsProps = {
    id: string;
};

export type TradingAccountRowProps = {
    account: TradingAccount;
};

export type TradeAccordionContentProps = {
    tradeId: string;
};

export type TradeTableRowProps = {
    trade: TradingAccountRecentTrade;
    isExpanded: boolean;
    onToggle: (tradeId: string) => void;
};

export type TradingListProps = {
    tradingAccountId: string;
    period: TradingAccountAnalyticsPeriod;
};
