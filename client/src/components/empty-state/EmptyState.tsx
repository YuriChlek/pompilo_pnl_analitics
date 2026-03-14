import clsx from 'clsx';
import { ReactNode } from 'react';
import styles from './styles.module.css';
import { DefaultIcon } from "@/components/default-icon/DefaultIcon";

type EmptyStateProps = {
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
};

export const EmptyState = ({ title, description, action, className }: EmptyStateProps) => {
    return (
        <div className={clsx(styles.empty, className)} role="status" aria-live="polite">
            <DefaultIcon />
            <div className={styles.copy}>
                <p className={styles.title}>{title}</p>
                {description ? <p className={styles.description}>{description}</p> : null}
            </div>
            {action ? <div className={styles.action}>{action}</div> : null}
        </div>
    );
};
