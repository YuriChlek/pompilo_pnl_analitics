'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { QueryDevtools } from '@/lib/providers/query-devtools';

export function Providers({ children }: Readonly<{ children: ReactNode }>) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <QueryDevtools />
        </QueryClientProvider>
    );
}
