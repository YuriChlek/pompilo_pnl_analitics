const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
});

const chartDateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
});

export const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) {
        return '—';
    }

    return currencyFormatter.format(value);
};

export const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined) {
        return '—';
    }

    return numberFormatter.format(value);
};

export const formatInteger = (value: number | null | undefined): string => {
    if (value === null || value === undefined) {
        return '—';
    }

    return integerFormatter.format(value);
};

export const formatPercent = (value: number | null | undefined): string => {
    if (value === null || value === undefined) {
        return '—';
    }

    return `${percentFormatter.format(value)}%`;
};

export const formatDateTime = (value: string | null | undefined): string => {
    if (!value) {
        return '—';
    }

    return dateTimeFormatter.format(new Date(value));
};

export const formatChartLabel = (value: string): string => {
    return chartDateFormatter.format(new Date(value));
};
