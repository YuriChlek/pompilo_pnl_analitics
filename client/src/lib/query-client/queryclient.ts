import { QueryClient } from '@tanstack/react-query';

export const createQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
                refetchOnWindowFocus: false,
                retry: (failureCount, error) => {
                    if ((error as { statusCode?: number })?.statusCode === 401) {
                        return false;
                    }
                    return failureCount < 3;
                },
            },
        },
    });
