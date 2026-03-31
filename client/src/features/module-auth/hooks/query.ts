import { User, UserRoles } from '@/features/module-auth/interfaces/auth';
import { useQuery } from '@tanstack/react-query';
import { authService } from '@/features/module-auth/api-service';

export const getUserQueryKey = (userRole: UserRoles) =>
    userRole === UserRoles.CUSTOMER ? ['customerData'] : ['adminData'];

export const useUser = (userRole: UserRoles, initialData?: User | null) => {
    const queryKey = getUserQueryKey(userRole);

    return useQuery<User | null>({
        queryKey,
        queryFn: (): Promise<User | null> => authService.getMe(userRole),
        initialData,
        gcTime: 300000,
        staleTime: 300000,
        refetchOnWindowFocus: false,
    });
};
