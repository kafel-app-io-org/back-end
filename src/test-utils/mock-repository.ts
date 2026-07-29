/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Test-only helpers. Excluded from coverage collection via jest
 * `collectCoverageFrom` (`!**\/test-utils/**`).
 */

/** A fully-mocked TypeORM repository (every method is a jest.fn()). */
export type MockRepository<T = any> = Record<keyof any, jest.Mock> & {
  [key: string]: jest.Mock;
};

export const createMockRepository = <T = any>(): MockRepository<T> =>
  ({
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findOneByOrFail: jest.fn(),
    findOneOrFail: jest.fn(),
    findBy: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn((v) => v),
    save: jest.fn((v) => v),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    softDelete: jest.fn(),
    softRemove: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
    preload: jest.fn(),
    merge: jest.fn((a, b) => Object.assign(a, b)),
    query: jest.fn(),
    createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
    manager: {
      transaction: jest.fn(),
      save: jest.fn((v) => v),
    } as any,
    metadata: { columns: [], relations: [] } as any,
  }) as any;

/** A chainable mocked TypeORM query builder. */
export const createMockQueryBuilder = (result: any = []) => {
  const qb: any = {};
  const chain = [
    'select',
    'addSelect',
    'from',
    'leftJoin',
    'leftJoinAndSelect',
    'innerJoin',
    'innerJoinAndSelect',
    'where',
    'andWhere',
    'orWhere',
    'orderBy',
    'addOrderBy',
    'groupBy',
    'addGroupBy',
    'having',
    'skip',
    'take',
    'limit',
    'offset',
    'setParameter',
    'setParameters',
    'distinct',
    'distinctOn',
    'withDeleted',
  ];
  chain.forEach((m) => {
    qb[m] = jest.fn(() => qb);
  });
  qb.getMany = jest.fn().mockResolvedValue(result);
  qb.getManyAndCount = jest.fn().mockResolvedValue([result, result.length]);
  qb.getOne = jest.fn().mockResolvedValue(result[0] ?? null);
  qb.getRawMany = jest.fn().mockResolvedValue(result);
  qb.getRawOne = jest.fn().mockResolvedValue(result[0] ?? null);
  qb.getCount = jest.fn().mockResolvedValue(result.length);
  qb.execute = jest.fn().mockResolvedValue(result);
  return qb;
};

/** Generic mock for an injected service/provider: every own method is a jest.fn(). */
export const createMockObject = (methods: string[]): Record<string, jest.Mock> =>
  methods.reduce((acc, m) => {
    acc[m] = jest.fn();
    return acc;
  }, {} as Record<string, jest.Mock>);
