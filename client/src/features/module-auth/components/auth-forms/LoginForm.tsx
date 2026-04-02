'use client';

import { FormEvent } from 'react';
import styles from '@/features/module-auth/components/auth-forms/styles.module.css';
import { useLogin } from '@/features/module-auth/hooks/mutation';
import { Button } from '@/components/button/Button';
import { UserRoles } from '@/features/module-auth/enums/auth.enums';
import type { LoginFormProps } from '@/features/module-auth/interfaces/component-props.interfaces';
import type { LoginData } from '@/features/module-auth/types/auth.types';

export const LoginForm = ({ mode, title }: LoginFormProps) => {
    const { mutate } = useLogin();

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const login = formData.get('login')?.toString() || '';
        const password = formData.get('password')?.toString() || '';
        const loginData: LoginData = {
            login,
            password,
            role: mode,
        };

        mutate(loginData);
    }

    return (
        <div className={styles.formWrapper}>
            <form className={styles.form} onSubmit={handleSubmit}>
                <h2>{title}</h2>
                <input type="login" name="login" placeholder="Login" required />
                <input type="password" name="password" placeholder="Password" required />
                <Button type="submit" className={styles.submitButton}>
                    Login
                </Button>
            </form>
        </div>
    );
};
