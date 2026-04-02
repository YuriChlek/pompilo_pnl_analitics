import Link from 'next/link';
import Image from 'next/image';
import logo from '@public/logo/pompilo-logo.svg';

export const Logo = () => {
    return (
        <Link href="/">
            <Image src={logo} alt="Pompilo logo" width={100} height={30} />
        </Link>
    );
};
