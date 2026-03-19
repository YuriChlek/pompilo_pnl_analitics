import { User, UserRoles } from '@/features/module-auth/interfaces/auth';
import { useQuery } from '@tanstack/react-query';
import { authService } from '@/features/module-auth/api-service';

export const useUser = (userRole: UserRoles) => {
    const queryKey = userRole === UserRoles.CUSTOMER ? ['customerData'] : ['adminData'];

    return useQuery<User | null>({
        queryKey,
        queryFn: (): Promise<User | null> => authService.getMe(userRole),
        gcTime: 300000,
        refetchInterval: 10000,
    });
};
