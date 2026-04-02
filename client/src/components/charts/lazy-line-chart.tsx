import dynamic from 'next/dynamic';

export const LazyLineChart = dynamic(
    () => import('@/components/charts/line-chart').then(module => module.LineChart),
    {
        ssr: false,
        loading: () => <div aria-hidden="true" style={{ minHeight: 360 }} />,
    },
);
