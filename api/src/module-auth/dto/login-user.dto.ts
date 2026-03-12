import { IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';
import { AuthPasswordDto } from '@/module-auth/dto/auth-password.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UserRoles } from '@/module-auth/enums/role.enum';

export class LoginUserDto extends AuthPasswordDto {
    @ApiProperty({
        description: 'Username or email address for login',
        example: 'john.doe@example.com',
    })
    @IsString({ message: 'Login must be a string.' })
    @IsNotEmpty({ message: 'Login is required.' })
    @Length(5, 255, { message: 'Login must be between 5 and 255 characters.' })
    @Type(() => String)
    login: string;

    @ApiProperty({
        description: 'Username or email address for login',
        example: UserRoles.CUSTOMER,
    })
    @IsNotEmpty({ message: 'Role is required.' })
    @IsEnum(UserRoles, { message: `Role must be one of: ${Object.values(UserRoles).join(', ')}` })
    role: UserRoles;
}
