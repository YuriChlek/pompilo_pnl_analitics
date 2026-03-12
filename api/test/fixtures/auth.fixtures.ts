let sequence = 1;

export const buildRegisterDto = (
    overrides: Partial<{ name: string; email: string; password: string }> = {},
) => ({
    name: `Test User ${sequence}`,
    email: `user${sequence++}@example.com`,
    password: 'Password1',
    ...overrides,
});

export const buildLoginDto = (
    overrides: Partial<{ login: string; password: string; role: string }> = {},
) => ({
    login: overrides.login ?? `user${sequence}@example.com`,
    password: overrides.password ?? 'Password1',
    role: overrides.role ?? ('customer' as const),
});
