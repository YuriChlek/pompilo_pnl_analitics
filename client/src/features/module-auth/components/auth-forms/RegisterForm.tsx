'use client';

import { FormEvent } from 'react';
import styles from './styles.module.css';
import { CreateUserData } from '@/features/module-auth/interfaces/auth';
import { useRegister } from '@/features/module-auth/hooks/mutation';
import { Button } from '@/components/button';

export const RegisterForm = () => {
    const { mutate, isPending, isError } = useRegister();

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        const createUserData: CreateUserData = { name, email, password };
        mutate(createUserData);
    }

    return (
        <div className={styles.formWrapper}>
            <form className={styles.form} onSubmit={handleSubmit}>
                <h2>Create account</h2>
                <input type="name" name="name" placeholder="Name" required />
                <input type="email" name="email" placeholder="Email" required />
                <input type="password" name="password" placeholder="Password" required />
                <Button type="submit" className={styles.submitButton}>
                    Register
                </Button>
            </form>
        </div>
    );
};
