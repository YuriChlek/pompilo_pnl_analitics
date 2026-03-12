import Link from 'next/link';

interface UserBadgeProps {
    userName: string;
}

export const UserBadge = ({ userName }: UserBadgeProps) => {
    return <Link href={'/customer/account'}>{userName}</Link>;
};
