import { CustomerHeader } from '@/features/module-customer/components/header/customer-header';
import { UserRoles } from '@/features/module-auth/enums/auth.enums';
import { getCurrentUser } from '@/features/module-auth/server/get-current-user';

export default async function CustomerLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const currentUser = await getCurrentUser(UserRoles.CUSTOMER);

    return (
        <>
            <CustomerHeader initialUser={currentUser} />
            <main className="page">{children}</main>
        </>
    );
}
