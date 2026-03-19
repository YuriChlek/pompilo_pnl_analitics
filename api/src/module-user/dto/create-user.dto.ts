import {
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    Length,
    Matches,
    MinLength,
} from 'class-validator';
import { USER_ROLES } from '@/module-auth/enums/auth-enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';

export class CreateUserDto {
    @ApiProperty({
        description: 'Full name of the user',
        example: 'John Doe',
        minLength: 2,
        maxLength: 50,
        required: true,
    })
    @IsString({ message: 'Name must be a string.' })
    @IsNotEmpty({ message: 'Name is required.' })
    @Length(2, 50, { message: 'The name must be between 2 and 50 characters.' })
    @Matches(/^[a-zA-Zа-яА-ЯіІїЇєЄґҐ\s\-'._]+$/, {
        message:
            'Name can only contain letters, spaces, hyphens, apostrophes, dots, and underscores.',
    })
    name: string;

    @ApiProperty({
        description: 'Email address for registration and communication',
        example: 'john.doe@example.com',
        maxLength: 255,
        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    })
    @IsString({ message: 'Email must be a string.' })
    @IsNotEmpty({ message: 'Email is required.' })
    @IsEmail({}, { message: 'Invalid email format.' })
    @Length(5, 255, { message: 'Email must be between 5 and 255 characters.' })
    @Matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
        message: 'Please provide a valid email address.',
    })
    @Type(() => String)
    email: string;

    @ApiProperty({
        description: 'User password.',
        example: 'SecurePass123',
        minLength: 6,
    })
    @IsString()
    @Exclude()
    @IsNotEmpty({ message: 'Password is required.' })
    @MinLength(6, { message: 'Password must be at least 6 characters.' })
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]/, {
        message: 'Password must contain at least one letter and one number.',
    })
    password: string;

    @ApiPropertyOptional({
        description: 'User role in the system',
        enum: USER_ROLES,
        enumName: 'UserRoles',
        example: USER_ROLES.CUSTOMER,
        default: USER_ROLES.CUSTOMER,
        required: false,
    })
    @IsOptional()
    @IsEnum(USER_ROLES, {
        message: `Role must be one of: ${Object.values(USER_ROLES).join(', ')}`,
    })
    role?: USER_ROLES = USER_ROLES.CUSTOMER;
}
