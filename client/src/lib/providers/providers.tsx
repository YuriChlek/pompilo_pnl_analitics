'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from '@/shared/theme/ThemeProvider';
import type { ReactNode } from 'react';

export function Providers({ children }: Readonly<{ children: ReactNode }>) {
    const queryClient = new QueryClient();
    return (
        <ThemeProvider>
            <QueryClientProvider client={queryClient}>
                {children}
                <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
        </ThemeProvider>
    );
}
