import styles from './styles.module.css';

export const DefaultIcon = () => (
    <div className={styles.icon}>
        <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
            <path
                d="M16 2.667L19.2 12.8L29.333 16L19.2 19.2L16 29.333L12.8 19.2L2.667 16L12.8 12.8L16 2.667Z"
                fill="currentColor"
                fillOpacity="0.5"
            />
        </svg>
    </div>
);
