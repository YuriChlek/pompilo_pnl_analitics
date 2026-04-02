import { LoginForm } from '@/features/module-auth/components/auth-forms/LoginForm';
import { UserRoles } from '@/features/module-auth/enums/auth.enums';

export default function AdminLoginPage() {
    return <LoginForm title={'Admin Login'} mode={UserRoles.ADMIN} />;
}
