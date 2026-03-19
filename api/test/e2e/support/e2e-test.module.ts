import {
    BadRequestException,
    Body,
    ConflictException,
    Controller,
    Delete,
    ExecutionContext,
    Get,
    HttpCode,
    Injectable,
    InternalServerErrorException,
    Module,
    NotFoundException,
    Param,
    Patch,
    UnauthorizedException,
    CanActivate,
} from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import type { Request, Response } from 'express';
import { CustomerAuthController } from '@/module-customer-auth/customer-auth.controller';
import { CustomerAuthService } from '@/module-customer-auth/services/customer-auth.service';
import { RegisterCustomerDto } from '@/module-customer-auth/dto/register-customer.dto';
import { LoginCustomerDto } from '@/module-customer-auth/dto/login-customer.dto';
import { UserPayload } from '@/module-user/interfaces/user.interface';
import { COOKIE_NAMES } from '@/module-auth/constants/auth.constants';
import { UserRoles } from '@/module-auth/enums/role.enum';
import { ApiKeysController } from '@/module-api-keys/api-keys.controller';
import { ApiKeysService } from '@/module-api-keys/services/api-keys.service';
import { CreateApiKeyDto } from '@/module-api-keys/dto/create-api-key.dto';
import { Exchanges, MarketTypes } from '@/module-api-keys/enums/api-keys-enums';
import type { AccessTokenPayload } from '@/module-auth-token/interfaces/auth-token.interfaces';
import { JwtAuthGuard } from '@/module-auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module-auth/guards/roles.guard';
import { TokenType } from '@/module-auth-token/interfaces/auth-token.interfaces';
import { TradingAccountController } from '@/module-trading-account/trading-account.controller';
import { TradingAccountService } from '@/module-trading-account/services/trading-account.service';
import { CreateTradingAccountDto } from '@/module-trading-account/dto/create-trading-account.dto';
import { UpdateUserDto } from '@/module-user/dto/update-user.dto';

type StoredUser = {
    id: string;
    name: string;
    email: string;
    password: string;
    role: UserRoles;
};

@Injectable()
export class FakeCustomerAuthService {
    private users: Map<string, StoredUser> = new Map();
    private sequence = 1;

    constructor() {
        this.reset();
    }

    reset(): void {
        this.users.clear();
        this.users.set('existing@example.com', {
            id: 'user-existing',
            name: 'Existing Customer',
            email: 'existing@example.com',
            password: 'Password1',
            role: UserRoles.CUSTOMER,
        });
        this.sequence = 1;
    }

    register(
        _response: Response,
        _request: Request,
        registerCustomerDto: RegisterCustomerDto,
    ): Promise<UserPayload> {
        if (this.users.has(registerCustomerDto.email)) {
            throw new ConflictException('User with this email or user name already exists.');
        }

        const id = `user-${this.sequence++}`;
        this.users.set(registerCustomerDto.email, {
            id,
            name: registerCustomerDto.name,
            email: registerCustomerDto.email,
            password: registerCustomerDto.password,
            role: UserRoles.CUSTOMER,
        });

        return Promise.resolve({
            id,
            name: registerCustomerDto.name,
            email: registerCustomerDto.email,
            role: UserRoles.CUSTOMER,
        });
    }

    login(
        _response: Response,
        _request: Request,
        loginCustomerDto: LoginCustomerDto,
    ): Promise<UserPayload> {
        const storedUser = this.users.get(loginCustomerDto.login);

        if (
            !storedUser ||
            storedUser.password !== loginCustomerDto.password ||
            storedUser.role !== loginCustomerDto.role
        ) {
            throw new UnauthorizedException('Login or password is not valid.');
        }

        return Promise.resolve({
            id: storedUser.id,
            email: storedUser.email,
            name: storedUser.name,
            role: storedUser.role,
        });
    }

    logout(): Promise<void> {
        return Promise.resolve();
    }

    refreshCustomerToken(_response: Response, request: Request): Promise<boolean> {
        const cookies = request.cookies as unknown as Record<string, string> | undefined;
        const refreshToken = cookies?.[COOKIE_NAMES.CUSTOMER_REFRESH_TOKEN];

        if (refreshToken === 'valid-refresh') {
            return Promise.resolve(true);
        }

        throw new UnauthorizedException('Unauthorized user token.');
    }

    getMe(): UserPayload | null {
        return null;
    }
}

@Injectable()
export class FakeApiKeysService {
    private records: Array<{
        id: string;
        userId: string;
        apiKey: string;
        apiKeyName: string;
        exchange: Exchanges;
        market: MarketTypes;
        connectionStatus: string;
    }> = [];
    private sequence = 1;

    reset(): void {
        this.records = [];
        this.sequence = 1;
    }

    create(request: Request, createApiKeyDto: CreateApiKeyDto) {
        const user = request.user as unknown as AccessTokenPayload | undefined;

        if (!user) {
            throw new UnauthorizedException('Invalid or missing user.');
        }

        if (createApiKeyDto.apiKey === 'fail-validation') {
            throw new BadRequestException('Api key validation failed.');
        }

        const id = `key-${this.sequence++}`;
        const maskedKey = `***${createApiKeyDto.apiKey.slice(-4)}`;
        const payload = {
            id,
            userId: user.userId,
            apiKey: maskedKey,
            apiKeyName: createApiKeyDto.apiKeyName ?? 'Default',
            exchange: createApiKeyDto.exchange,
            market: createApiKeyDto.market,
            connectionStatus: 'connected',
        };
        this.records.push(payload);

        return Promise.resolve(payload);
    }

    getUserApiKeys(request: Request) {
        const user = request.user as unknown as AccessTokenPayload | undefined;

        if (!user) {
            throw new UnauthorizedException('Invalid or missing user.');
        }

        return Promise.resolve(this.records.filter(record => record.userId === user.userId));
    }
}

@Injectable()
export class FakeTradingAccountService {
    private accounts: Array<{
        id: string;
        tradingAccountName: string;
        apiKeyId: string;
        exchange: Exchanges;
        market: MarketTypes;
    }> = [];
    private sequence = 1;
    private readonly activeApiKey = '118d866c-048f-4710-be77-a9ab672456c4';

    reset(): void {
        this.accounts = [];
        this.sequence = 1;
    }

    create(
        createTradingAccountDto: CreateTradingAccountDto,
    ): Promise<(typeof this.accounts)[number]> {
        if (createTradingAccountDto.tradingAccountName === 'boom') {
            throw new InternalServerErrorException('Failed to create trading account');
        }

        if (createTradingAccountDto.apiKeyId !== this.activeApiKey) {
            throw new BadRequestException('Provided API key is not active.');
        }

        const payload = {
            id: `account-${this.sequence++}`,
            tradingAccountName: createTradingAccountDto.tradingAccountName,
            apiKeyId: createTradingAccountDto.apiKeyId,
            exchange: createTradingAccountDto.exchange,
            market: createTradingAccountDto.market,
        };
        this.accounts.push(payload);

        return Promise.resolve(payload);
    }

    findAll(): Promise<typeof this.accounts> {
        return Promise.resolve(this.accounts);
    }
}

type StoredUserRecord = {
    id: string;
    name: string;
    email: string;
};

@Injectable()
export class FakeUsersHttpService {
    private users: Map<string, StoredUserRecord> = new Map();
    private sequence = 3;

    constructor() {
        this.reset();
    }

    reset(): void {
        this.users = new Map([
            [
                'user-1',
                {
                    id: 'user-1',
                    name: 'Primary Customer',
                    email: 'primary@example.com',
                },
            ],
            [
                'user-2',
                {
                    id: 'user-2',
                    name: 'Secondary Customer',
                    email: 'secondary@example.com',
                },
            ],
        ]);
        this.sequence = 3;
    }

    getUserById(id: string): StoredUserRecord {
        const user = this.users.get(id);

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return user;
    }

    updateUser(id: string, updateUserDto: UpdateUserDto): StoredUserRecord {
        const user = this.users.get(id);

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        if (
            updateUserDto.email &&
            Array.from(this.users.values()).some(
                existing => existing.email === updateUserDto.email && existing.id !== id,
            )
        ) {
            throw new ConflictException('A user with this email or username already exists.');
        }

        const updatedUser = {
            ...user,
            ...updateUserDto,
        };

        this.users.set(id, updatedUser);

        return updatedUser;
    }

    deleteUser(id: string): { id: string } {
        if (!this.users.has(id)) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        this.users.delete(id);

        return { id };
    }
}

@Controller('customer/users')
export class UsersTestController {
    constructor(private readonly usersService: FakeUsersHttpService) {}

    @Get(':id')
    getUser(@Param('id') id: string) {
        return this.usersService.getUserById(id);
    }

    @Patch(':id')
    updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.updateUser(id, updateUserDto);
    }

    @Delete(':id')
    @HttpCode(200)
    deleteUser(@Param('id') id: string) {
        return this.usersService.deleteUser(id);
    }
}

@Injectable()
export class TestingJwtAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request: Request = context.switchToHttp().getRequest();
        const authHeader = request.headers['x-test-auth'];

        if (!authHeader || Array.isArray(authHeader)) {
            throw new UnauthorizedException('Unauthorized user token.');
        }

        const [role = UserRoles.CUSTOMER, userId = 'user-guard'] = authHeader.split(':');

        if (!Object.values<string>(UserRoles).includes(role)) {
            throw new UnauthorizedException('Unauthorized user token.');
        }

        const payload: AccessTokenPayload = {
            sub: userId,
            userId,
            email: `${userId}@example.com`,
            username: 'Test User',
            role: role as UserRoles,
            ipAddress: '127.0.0.1',
            userAgent: 'supertest',
            type: TokenType.ACCESS,
        };

        request.user = payload;

        return true;
    }
}

@Controller()
export class RootPingController {
    @Get()
    ping(): string {
        return 'Hello World!';
    }
}

@Module({
    controllers: [CustomerAuthController],
    providers: [
        FakeCustomerAuthService,
        {
            provide: CustomerAuthService,
            useExisting: FakeCustomerAuthService,
        },
    ],
})
export class CustomerAuthTestModule {}

@Module({
    controllers: [ApiKeysController],
    providers: [
        FakeApiKeysService,
        {
            provide: ApiKeysService,
            useExisting: FakeApiKeysService,
        },
        {
            provide: JwtAuthGuard,
            useClass: TestingJwtAuthGuard,
        },
        RolesGuard,
    ],
})
export class ApiKeysTestModule {}

@Module({
    controllers: [TradingAccountController],
    providers: [
        FakeTradingAccountService,
        {
            provide: TradingAccountService,
            useExisting: FakeTradingAccountService,
        },
        {
            provide: JwtAuthGuard,
            useClass: TestingJwtAuthGuard,
        },
        RolesGuard,
    ],
})
export class TradingAccountTestModule {}

@Module({
    controllers: [UsersTestController],
    providers: [FakeUsersHttpService],
})
export class UsersTestModule {}

@Module({
    imports: [
        CustomerAuthTestModule,
        ApiKeysTestModule,
        TradingAccountTestModule,
        UsersTestModule,
        RouterModule.register([
            {
                path: 'customer',
                children: [
                    {
                        path: '',
                        module: CustomerAuthTestModule,
                    },
                    {
                        path: 'api-key',
                        module: ApiKeysTestModule,
                    },
                    {
                        path: 'trading-account',
                        module: TradingAccountTestModule,
                    },
                ],
            },
        ]),
    ],
    controllers: [RootPingController],
})
export class E2ETestApplicationModule {}
