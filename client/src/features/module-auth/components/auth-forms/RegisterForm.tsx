'use client';

import { useRouter } from 'next/navigation';
import { FormEvent } from 'react';
import { authService } from '@/features/module-auth/api-service';
import styles from './styles.module.css';
import { CreateUserData, User } from '@/features/module-auth/interfaces/auth';
import { useRegister } from '@/features/module-auth/hooks';

export const RegisterForm = () => {
    const router = useRouter();
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
                <button type="submit">Login</button>
            </form>
        </div>
    );
};
