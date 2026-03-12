import { CustomerHeader } from '@/features/module-customer/components/header/CustomerHeader';

export default function PublicLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <CustomerHeader />
            <main className="page">{children}</main>
        </>
    );
}
