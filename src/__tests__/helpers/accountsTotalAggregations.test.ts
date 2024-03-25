import { DateTime } from 'luxon';

import { aggregateChildrenTotals, aggregateMonthlyWorth } from '@/helpers/accountsTotalAggregations';
import Money from '@/book/Money';
import { PriceDBMap } from '@/book/prices';
import { Price } from '@/book/entities';
import type { Account, Commodity } from '@/book/entities';

describe('accountsTotalAggregations', () => {
  let eur: Commodity;
  let accounts: Account[];

  beforeEach(() => {
    jest.spyOn(Price, 'create').mockReturnValue({ guid: 'missing_price' } as Price);
    eur = {
      guid: 'eur',
      namespace: 'CURRENCY',
      mnemonic: 'EUR',
    } as Commodity;

    accounts = [
      {
        guid: 'root',
        name: 'Root',
        type: 'ROOT',
        childrenIds: ['a1', 'a2', 'a3', 'a4'],
      } as Account,
      {
        guid: 'a1',
        type: 'ASSET',
        commodity: eur,
        parentId: 'root',
        childrenIds: [] as string[],
      } as Account,
      {
        guid: 'a2',
        type: 'LIABILITY',
        commodity: eur,
        parentId: 'root',
        childrenIds: [] as string[],
      } as Account,
      {
        guid: 'a3',
        type: 'INCOME',
        commodity: eur,
        parentId: 'root',
        childrenIds: [] as string[],
      } as Account,
      {
        guid: 'a4',
        type: 'EXPENSE',
        commodity: eur,
        parentId: 'root',
        childrenIds: [] as string[],
      } as Account,
    ];
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  describe('aggregateMonthlyWorth', () => {
    it('aggregates monthly data', () => {
      const monthlyTotals = [
        {
          a1: new Money(100, 'EUR'),
          a2: new Money(200, 'EUR'),
        },
        {
          a1: new Money(200, 'EUR'),
          a2: new Money(200, 'EUR'),
        },
        {
          a1: new Money(300, 'EUR'),
          a2: new Money(400, 'EUR'),
        },
      ];

      const aggregated = aggregateMonthlyWorth(
        'root',
        accounts,
        monthlyTotals,
        [
          DateTime.now().minus({ month: 2 }),
          DateTime.now().minus({ month: 1 }),
          DateTime.now(),
        ],
      );

      expect(aggregated[0].root.toString()).toEqual('0.00 undefined');
      expect(aggregated[1].root.toString()).toEqual('0.00 undefined');

      expect(aggregated[0].a1.toString()).toEqual('100.00 EUR');
      expect(aggregated[1].a1.toString()).toEqual('300.00 EUR');
      expect(aggregated[2].a1.toString()).toEqual('600.00 EUR');

      expect(aggregated[0].a2.toString()).toEqual('200.00 EUR');
      expect(aggregated[1].a2.toString()).toEqual('400.00 EUR');
      expect(aggregated[2].a2.toString()).toEqual('800.00 EUR');

      expect(aggregated[0].a3.toString()).toEqual('0.00 EUR');
      expect(aggregated[1].a3.toString()).toEqual('0.00 EUR');

      expect(aggregated[0].a4.toString()).toEqual('0.00 EUR');
      expect(aggregated[1].a4.toString()).toEqual('0.00 EUR');
    });

    /**
     * Due to eventual consistency in state, sometimes it may be that
     * an interval of X months is passed but the monthlyTotals are with less
     * data points because it still has the previous query loaded.
     */
    it('works when less totals than amount of dates', () => {
      const monthlyTotals = [
        {
          a1: new Money(100, 'EUR'),
          a2: new Money(200, 'EUR'),
        },
        {
          a1: new Money(200, 'EUR'),
          a2: new Money(200, 'EUR'),
        },
      ];

      const aggregated = aggregateMonthlyWorth(
        'root',
        accounts,
        monthlyTotals,
        [
          DateTime.now().minus({ month: 2 }),
          DateTime.now().minus({ month: 1 }),
          DateTime.now(),
        ],
      );

      expect(aggregated[0].root.toString()).toEqual('0.00 undefined');
      expect(aggregated[1].root.toString()).toEqual('0.00 undefined');

      expect(aggregated[0].a1.toString()).toEqual('100.00 EUR');
      expect(aggregated[1].a1.toString()).toEqual('300.00 EUR');
      // No monthly totals so it is +0
      expect(aggregated[2].a1.toString()).toEqual('300.00 EUR');

      expect(aggregated[0].a2.toString()).toEqual('200.00 EUR');
      expect(aggregated[1].a2.toString()).toEqual('400.00 EUR');
      // No monthly totals so it is +0
      expect(aggregated[2].a2.toString()).toEqual('400.00 EUR');
    });
  });

  describe('aggregateChildrenTotals', () => {
    it('creates default account type entries', () => {
      const totals = aggregateChildrenTotals(
        'root',
        accounts,
        {} as PriceDBMap,
        DateTime.now(),
        {},
      );

      expect(totals.type_asset.toString()).toEqual('0.00 EUR');
      expect(totals.type_liability.toString()).toEqual('0.00 EUR');
      expect(totals.type_income.toString()).toEqual('0.00 EUR');
      expect(totals.type_expense.toString()).toEqual('0.00 EUR');
    });

    it('aggregates children with same currency', () => {
      accounts[4].childrenIds = ['a5', 'a6'];
      accounts = [
        ...accounts,
        {
          guid: 'a5',
          type: 'EXPENSE',
          commodity: eur,
          parentId: 'a4',
          childrenIds: [] as string[],
        } as Account,
        {
          guid: 'a6',
          type: 'EXPENSE',
          commodity: eur,
          parentId: 'a4',
          childrenIds: [] as string[],
        } as Account,
      ];

      const totals = {
        a5: new Money(500, 'EUR'),
        a6: new Money(200, 'EUR'),
      };
      const aggregatedTotals = aggregateChildrenTotals(
        'root',
        accounts,
        {} as PriceDBMap,
        DateTime.now(),
        totals,
      );

      expect(aggregatedTotals.type_expense.toString()).toEqual('700.00 EUR');
      expect(aggregatedTotals.a5.toString()).toEqual('500.00 EUR');
      expect(aggregatedTotals.a6.toString()).toEqual('200.00 EUR');

      // Check that we don't modify original totals
      expect(Object.keys(totals)).toHaveLength(2);
    });

    it('aggregates children with different currency', () => {
      const usd = {
        guid: 'usd',
        mnemonic: 'USD',
        namespace: 'CURRENCY',
      };

      accounts[4].childrenIds = ['a5', 'a6'];
      accounts = [
        ...accounts,
        {
          guid: 'a5',
          type: 'EXPENSE',
          commodity: eur,
          parentId: 'a4',
          childrenIds: [] as string[],
        } as Account,
        {
          guid: 'a6',
          type: 'EXPENSE',
          commodity: usd,
          parentId: 'a4',
          childrenIds: [] as string[],
        } as Account,
      ];

      const prices = [
        {
          date: DateTime.now(),
          value: 0.9,
          commodity: usd,
          currency: eur,
        },
      ] as Price[];

      const totals = aggregateChildrenTotals(
        'root',
        accounts,
        new PriceDBMap(prices),
        DateTime.now(),
        {
          a5: new Money(500, 'EUR'),
          a6: new Money(200, 'USD'),
        },
      );

      // 500 + 200 * 0.8
      expect(totals.type_expense.toString()).toEqual('680.00 EUR');
      expect(totals.a5.toString()).toEqual('500.00 EUR');
      expect(totals.a6.toString()).toEqual('200.00 USD');
    });

    it('aggregates children with different currency and specific date', () => {
      const usd = {
        guid: 'usd',
        mnemonic: 'USD',
        namespace: 'CURRENCY',
      };

      accounts[4].childrenIds = ['a5', 'a6'];
      accounts = [
        ...accounts,
        {
          guid: 'a5',
          type: 'EXPENSE',
          commodity: eur,
          parentId: 'a4',
          childrenIds: [] as string[],
        } as Account,
        {
          guid: 'a6',
          type: 'EXPENSE',
          commodity: usd,
          parentId: 'a4',
          childrenIds: [] as string[],
        } as Account,
      ];

      const prices = [
        {
          date: DateTime.now().minus({ month: 1 }),
          value: 0.8,
          commodity: usd,
          currency: eur,
        },
        {
          date: DateTime.now(),
          value: 0.9,
          commodity: usd,
          currency: eur,
        },
      ] as Price[];

      const totals = aggregateChildrenTotals(
        'root',
        accounts,
        new PriceDBMap(prices),
        DateTime.now().minus({ month: 1 }),
        {
          a5: new Money(500, 'EUR'),
          a6: new Money(200, 'USD'),
        },
      );

      // 500 + 200 * 0.8
      expect(totals.type_expense.toString()).toEqual('660.00 EUR');
      expect(totals.a5.toString()).toEqual('500.00 EUR');
      expect(totals.a6.toString()).toEqual('200.00 USD');
    });

    it('aggregates children that are stocks', () => {
      const usd = {
        guid: 'usd',
        mnemonic: 'USD',
        namespace: 'CURRENCY',
      };

      const ticker1 = {
        guid: 'ticker1',
        mnemonic: 'TICKER1',
        namespace: 'CUSTOM',
      };

      const ticker2 = {
        guid: 'ticker2',
        mnemonic: 'TICKER2',
        namespace: 'STOCK',
      };

      accounts[1].childrenIds = ['a5', 'a6'];
      accounts = [
        ...accounts,
        {
          guid: 'a5',
          type: 'INVESTMENT',
          commodity: ticker1,
          parentId: 'a1',
          childrenIds: [] as string[],
        } as Account,
        {
          guid: 'a6',
          type: 'INVESTMENT',
          commodity: ticker2,
          parentId: 'a1',
          childrenIds: [] as string[],
        } as Account,
      ];

      const prices = [
        {
          date: DateTime.now(),
          value: 100,
          commodity: ticker1,
          currency: eur,
        },
        {
          date: DateTime.now(),
          value: 50,
          commodity: ticker2,
          currency: usd,
        },
        {
          date: DateTime.now(),
          value: 0.9,
          commodity: usd,
          currency: eur,
        },
      ] as Price[];

      const totals = aggregateChildrenTotals(
        'root',
        accounts,
        new PriceDBMap(prices),
        DateTime.now(),
        {
          a5: new Money(2, 'TICKER1'),
          a6: new Money(5, 'TICKER2'),
        },
      );

      // 2 * 100 + 5 * 50 * 0.9
      expect(totals.type_asset.toString()).toEqual('425.00 EUR');
      expect(totals.a5.toString()).toEqual('2.00 TICKER1');
      expect(totals.a6.toString()).toEqual('5.00 TICKER2');
    });

    it('works with children without totals', () => {
      accounts[4].childrenIds = ['a5'];
      accounts = [
        ...accounts,
        {
          guid: 'a5',
          type: 'INVESTMENT',
          commodity: eur,
          parentId: 'a1',
          childrenIds: [] as string[],
        } as Account,
      ];

      const totals = aggregateChildrenTotals(
        'root',
        accounts,
        {} as PriceDBMap,
        DateTime.now(),
        {},
      );

      expect(totals.type_asset.toString()).toEqual('0.00 EUR');
      expect(totals.a5.toString()).toEqual('0.00 EUR');
    });
  });
});
