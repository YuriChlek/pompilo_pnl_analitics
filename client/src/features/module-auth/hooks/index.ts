import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/features/module-auth/api-service';
import { CreateUserData, LoginData, User, UserRoles } from '@/features/module-auth/interfaces/auth';
import { useRouter } from 'next/navigation';

export const useRegister = () => {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: async (createUserData: CreateUserData) => {
            const { name, email, password } = createUserData;

            return await authService.register(name, email, password);
        },

        onSuccess: newUser => {
            if (newUser) {
                const { role } = newUser;
                const stateName = role === UserRoles.CUSTOMER ? 'customerData' : 'adminData';
                queryClient.setQueryData([stateName], newUser);

                router.push('/');
            }
        },

        onError: error => {
            console.log(error.message);
        },
    });
};

export const useLogin = () => {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: async (loginData: LoginData) => {
            const { login, password, role } = loginData;

            return await authService.login(login, password, role);
        },

        onSuccess: newUser => {
            if (newUser) {
                const { role } = newUser;
                const stateName = role === UserRoles.CUSTOMER ? 'customerData' : 'adminData';

                queryClient.setQueryData([stateName], newUser);

                const adminRoles: UserRoles[] = [UserRoles.ADMIN, UserRoles.SUPER_ADMIN];
                const redirectPath: string = adminRoles.includes(role)
                    ? '/admin/dashboard'
                    : role === UserRoles.CUSTOMER
                      ? '/customer/dashboard'
                      : '/login';

                router.push(redirectPath);
            }
        },

        onError: error => {
            console.log(error.message);
        },
    });
};

export const useLogout = () => {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: async () => {
            return await authService.logout(UserRoles.CUSTOMER);
        },

        onSuccess: () => {
            queryClient.clear();
            router.refresh();
            router.replace('/');
        },

        onError: error => {
            console.log(error.message);
        },
    });
};

export const useUser = (userRole: UserRoles) => {
    const queryKey = userRole === UserRoles.CUSTOMER ? ['customerData'] : ['adminData'];

    return useQuery<User | null>({
        queryKey,
        queryFn: (): Promise<User | null> => authService.getMe(userRole),
        gcTime: 300000,
        refetchInterval: 10000,
    });
};
