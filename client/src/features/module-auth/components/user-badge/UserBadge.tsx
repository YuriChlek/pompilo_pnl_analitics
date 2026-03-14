import Link from 'next/link';
import styles from '@/features/module-auth/components/user-badge/styles.module.css';

interface UserBadgeProps {
    userName: string;
}

export const UserBadge = ({ userName }: UserBadgeProps) => {
    return (
        <Link className={styles.userBadge} href={'/customer/account'}>
            {userName}
        </Link>
    );
};
