import { LoginForm } from '@/features/module-auth/components/auth-forms/login-form';
import { UserRoles } from '@/features/module-auth/enums/auth.enums';

export default function LoginPage() {
    return <LoginForm title={'Customer Login'} mode={UserRoles.CUSTOMER} />;
}
