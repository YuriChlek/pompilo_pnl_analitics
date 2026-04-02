import Link from 'next/link';
import styles from '@/features/module-auth/components/user-badge/styles.module.css';
import type { UserBadgeProps } from '@/features/module-auth/interfaces/component-props.interfaces';

export const UserBadge = ({ userName }: UserBadgeProps) => {
    return (
        <Link className={styles.userBadge} href={'/customer/account'}>
            {userName}
        </Link>
    );
};
