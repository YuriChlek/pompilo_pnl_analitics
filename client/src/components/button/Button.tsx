import { forwardRef, type ButtonHTMLAttributes } from 'react';
import styles from '@/components/button/styles.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { children, className, variant = 'primary', size = 'md', type = 'button', disabled, ...rest },
    ref,
) {
    const classes = [
        styles.button,
        styles[variant],
        size === 'sm' ? styles.sizeSm : styles.sizeMd,
        disabled ? styles.disabled : '',
        className ?? '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <button ref={ref} className={classes} type={type} disabled={disabled} {...rest}>
            {children}
        </button>
    );
});
