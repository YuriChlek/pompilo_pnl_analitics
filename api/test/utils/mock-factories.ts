import type { ObjectLiteral, Repository } from 'typeorm';

type MethodNames<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

type MockedMethods<T, K extends keyof T> = {
    [P in K]: T[P] extends (...args: infer A) => infer R ? jest.Mock<R, A> : T[P];
};

export function createMock<T extends object, K extends MethodNames<T>>(
    methodNames: K[],
    overrides: Partial<T> = {},
): MockedMethods<T, K> & T {
    const mock: Partial<Record<string, jest.Mock>> = {};

    methodNames.forEach(name => {
        mock[name as string] = jest.fn();
    });

    return {
        ...(mock as MockedMethods<T, K>),
        ...(overrides as T),
    };
}

export const createMockRepository = <T extends ObjectLiteral>(
    methodNames: Array<MethodNames<Repository<T>>>,
    overrides: Partial<Repository<T>> = {},
): jest.Mocked<Repository<T>> =>
    createMock<Repository<T>, MethodNames<Repository<T>>>(methodNames, overrides) as jest.Mocked<
        Repository<T>
    >;
