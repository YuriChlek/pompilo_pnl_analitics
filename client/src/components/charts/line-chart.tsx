'use client';

import ReactECharts from 'echarts-for-react';

const tooltipNumberFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

type LineChartSeries = {
    name: string;
    data: number[];
    color?: string;
};

type LineChartData = {
    categories: string[];
    series: LineChartSeries[];
};

type LineChartProps = {
    data: LineChartData;
    width?: number | string;
    height?: number | string;
    smooth?: boolean;
    area?: boolean;
};

export const LineChart = ({
    data,
    width = '100%',
    height = 400,
    smooth = false,
    area = false,
}: LineChartProps) => {
    const option = {
        tooltip: {
            trigger: 'axis',
            formatter: (
                params:
                    | {
                          axisValueLabel?: string;
                          seriesName?: string;
                          value?: number | string | null;
                      }[]
                    | {
                          axisValueLabel?: string;
                          seriesName?: string;
                          value?: number | string | null;
                      },
            ) => {
                const items = Array.isArray(params) ? params : [params];
                const axisLabel = items[0]?.axisValueLabel ?? '';
                const lines = items.map(item => {
                    const numericValue =
                        typeof item.value === 'number' ? item.value : Number(item.value);
                    const formattedValue = Number.isFinite(numericValue)
                        ? tooltipNumberFormatter.format(numericValue)
                        : '—';

                    return `${item.seriesName ?? ''}: ${formattedValue}`;
                });

                return [axisLabel, ...lines].filter(Boolean).join('<br/>');
            },
        },
        grid: {
            top: 24,
            right: 24,
            bottom: 24,
            left: 24,
            containLabel: true,
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: data.categories,
        },
        yAxis: {
            type: 'value',
            scale: true,
        },
        series: data.series.map(series => ({
            name: series.name,
            type: 'line',
            data: series.data,
            smooth,
            showSymbol: false,
            lineStyle: {
                width: 3,
                color: series.color,
            },
            itemStyle: {
                color: series.color,
            },
            areaStyle: area
                ? {
                      opacity: 0.16,
                      color: series.color,
                  }
                : undefined,
        })),
    };

    return (
        <ReactECharts
            option={option}
            style={{
                width,
                height,
            }}
            notMerge={true}
            lazyUpdate={true}
        />
    );
};
