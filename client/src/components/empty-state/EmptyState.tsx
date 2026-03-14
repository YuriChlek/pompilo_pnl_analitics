import { ReactNode } from 'react';
import styles from './styles.module.css';

type EmptyStateProps = {
    title: string;
    description?: string;
    action?: ReactNode;
    icon?: ReactNode;
    className?: string;
};

const DefaultIcon = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
        <path
            d="M16 2.667L19.2 12.8L29.333 16L19.2 19.2L16 29.333L12.8 19.2L2.667 16L12.8 12.8L16 2.667Z"
            fill="currentColor"
            fillOpacity="0.5"
        />
    </svg>
);

export const EmptyState = ({ title, description, action, icon, className }: EmptyStateProps) => {
    const containerClassName = className ? `${styles.empty} ${className}` : styles.empty;

    return (
        <div className={containerClassName} role="status" aria-live="polite">
            <div className={styles.icon}>{icon ?? <DefaultIcon />}</div>
            <div className={styles.copy}>
                <p className={styles.title}>{title}</p>
                {description ? <p className={styles.description}>{description}</p> : null}
            </div>
            {action ? <div className={styles.action}>{action}</div> : null}
        </div>
    );
};
