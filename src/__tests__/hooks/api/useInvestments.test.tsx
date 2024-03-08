import { renderHook } from '@testing-library/react';
import * as query from '@tanstack/react-query';

import { useInvestment, useInvestments } from '@/hooks/api/useInvestments';
import { InvestmentAccount } from '@/book/models';
import * as queries from '@/lib/queries/getInvestments';
import * as useAccountsHook from '@/hooks/api/useAccounts';
import * as useSplitsHook from '@/hooks/api/useSplits';
import * as useMainCurrencyHook from '@/hooks/api/useMainCurrency';
import type { Account, Commodity, Split } from '@/book/entities';

jest.mock('@tanstack/react-query');
jest.mock('@/lib/queries/getInvestments');
jest.mock('@/hooks/api/useAccounts');
jest.mock('@/hooks/api/useSplits');
jest.mock('@/hooks/api/useMainCurrency');

describe('useInvestment', () => {
  let investment: InvestmentAccount;

  beforeEach(() => {
    investment = {
      account: {
        guid: 'guid',
      } as Account,
    } as InvestmentAccount;

    jest.spyOn(queries, 'initInvestment').mockResolvedValue(investment);
    jest.spyOn(query, 'useQuery').mockReturnValue({
      data: { account: { guid: '1' } } as InvestmentAccount,
      dataUpdatedAt: 123,
    } as query.UseQueryResult<InvestmentAccount>);

    jest.spyOn(useAccountsHook, 'useAccount').mockReturnValue({
      data: undefined,
    } as query.UseQueryResult<Account>);
    jest.spyOn(useSplitsHook, 'useSplits').mockReturnValue({
      data: undefined,
    } as query.UseQueryResult<Split[]>);
    jest.spyOn(useMainCurrencyHook, 'useMainCurrency').mockReturnValue({
      data: undefined,
    } as query.UseQueryResult<Commodity>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls query with enabled false when no account', async () => {
    const mainCurrency = { guid: 'c_guid' };
    const splits = [{ guid: 'sp_guid' }];
    jest.spyOn(useSplitsHook, 'useSplits').mockReturnValue({
      data: splits,
    } as query.UseQueryResult<Split[]>);
    jest.spyOn(useMainCurrencyHook, 'useMainCurrency').mockReturnValue({
      data: mainCurrency,
    } as query.UseQueryResult<Commodity>);

    renderHook(() => useInvestment('guid'));

    expect(query.useQuery).toBeCalledWith(expect.objectContaining({
      enabled: false,
    }));
  });

  it('calls query with enabled false when no splits', async () => {
    const account = { guid: 'guid' };
    const mainCurrency = { guid: 'c_guid' };
    jest.spyOn(useAccountsHook, 'useAccount').mockReturnValue({
      data: account,
    } as query.UseQueryResult<Account>);
    jest.spyOn(useMainCurrencyHook, 'useMainCurrency').mockReturnValue({
      data: mainCurrency,
    } as query.UseQueryResult<Commodity>);

    renderHook(() => useInvestment('guid'));

    expect(query.useQuery).toBeCalledWith(expect.objectContaining({
      enabled: false,
    }));
  });

  it('calls query with enabled false when no mainCurrency', async () => {
    const account = { guid: 'guid' };
    const splits = [{ guid: 'sp_guid' }];
    jest.spyOn(useAccountsHook, 'useAccount').mockReturnValue({
      data: account,
    } as query.UseQueryResult<Account>);
    jest.spyOn(useSplitsHook, 'useSplits').mockReturnValue({
      data: splits,
    } as query.UseQueryResult<Split[]>);

    renderHook(() => useInvestment('guid'));

    expect(query.useQuery).toBeCalledWith(expect.objectContaining({
      enabled: false,
    }));
  });

  it('calls query as expected', async () => {
    const account = { guid: 'guid' };
    const mainCurrency = { guid: 'c_guid' };
    const splits = [{ guid: 'sp_guid' }];
    jest.spyOn(useAccountsHook, 'useAccount').mockReturnValue({
      data: account,
      dataUpdatedAt: 1,
    } as query.UseQueryResult<Account>);
    jest.spyOn(useSplitsHook, 'useSplits').mockReturnValue({
      data: splits,
      dataUpdatedAt: 2,
    } as query.UseQueryResult<Split[]>);
    jest.spyOn(useMainCurrencyHook, 'useMainCurrency').mockReturnValue({
      data: mainCurrency,
      dataUpdatedAt: 3,
    } as query.UseQueryResult<Commodity>);
    jest.spyOn(query, 'useQueryClient').mockReturnValue({
      setQueryData: jest.fn() as query.QueryClient['setQueryData'],
    } as query.QueryClient);

    renderHook(() => useInvestment('guid'));

    expect(useAccountsHook.useAccount).toBeCalledWith('guid');
    expect(useSplitsHook.useSplits).toBeCalledWith({ guid: 'guid' });
    expect(query.useQuery).toBeCalledWith({
      queryKey: [
        'api', 'investments',
        {
          account: 'guid',
          accountUpdatedAt: 1,
          splitsUpdatedAt: 2,
          currencyUpdatedAt: 3,
        },
      ],
      queryFn: expect.any(Function),
      enabled: true,
      networkMode: 'always',
    });

    const callArgs = (query.useQuery as jest.Mock).mock.calls[0][0];
    callArgs.queryFn();
    expect(queries.initInvestment).toBeCalledWith(account, mainCurrency, splits);
  });
});

describe('useInvestments', () => {
  let investment: InvestmentAccount;

  beforeEach(() => {
    investment = {
      account: {
        guid: 'guid',
      } as Account,
    } as InvestmentAccount;

    jest.spyOn(queries, 'initInvestment').mockResolvedValue(investment);
    jest.spyOn(query, 'useQuery').mockReturnValue({
      data: { account: { guid: '1' } } as InvestmentAccount,
    } as query.UseQueryResult<InvestmentAccount>);

    jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
      data: undefined,
    } as query.UseQueryResult<Account[]>);
    jest.spyOn(useSplitsHook, 'useSplits').mockReturnValue({
      data: undefined,
    } as query.UseQueryResult<Split[]>);
    jest.spyOn(useMainCurrencyHook, 'useMainCurrency').mockReturnValue({
      data: undefined,
    } as query.UseQueryResult<Commodity>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls query with enabled false when no accounts', async () => {
    const mainCurrency = { guid: 'c_guid' };
    const splits = [{ guid: 'sp_guid' }];
    jest.spyOn(useSplitsHook, 'useSplits').mockReturnValue({
      data: splits,
    } as query.UseQueryResult<Split[]>);
    jest.spyOn(useMainCurrencyHook, 'useMainCurrency').mockReturnValue({
      data: mainCurrency,
    } as query.UseQueryResult<Commodity>);

    renderHook(() => useInvestments());

    expect(query.useQuery).toBeCalledWith(expect.objectContaining({
      enabled: false,
    }));
  });

  it('calls query with enabled false when no splits', async () => {
    const account = { guid: 'guid' };
    const mainCurrency = { guid: 'c_guid' };
    jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
      data: [account],
    } as query.UseQueryResult<Account[]>);
    jest.spyOn(useMainCurrencyHook, 'useMainCurrency').mockReturnValue({
      data: mainCurrency,
    } as query.UseQueryResult<Commodity>);

    renderHook(() => useInvestments());

    expect(query.useQuery).toBeCalledWith(expect.objectContaining({
      enabled: false,
    }));
  });

  it('calls query with enabled false when no mainCurrency', async () => {
    const account = { guid: 'guid' };
    const splits = [{ guid: 'sp_guid' }];
    jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
      data: [account],
    } as query.UseQueryResult<Account[]>);
    jest.spyOn(useSplitsHook, 'useSplits').mockReturnValue({
      data: splits,
    } as query.UseQueryResult<Split[]>);

    renderHook(() => useInvestments());

    expect(query.useQuery).toBeCalledWith(expect.objectContaining({
      enabled: false,
    }));
  });

  it('calls query as expected', async () => {
    const account1 = { guid: 'guid', type: 'INVESTMENT' };
    const account2 = { guid: 'guid', type: 'ASSET' };
    const mainCurrency = { guid: 'c_guid' };
    const splits = [{ guid: 'sp_guid' }];
    jest.spyOn(useAccountsHook, 'useAccounts').mockReturnValue({
      data: [account1, account2],
    } as query.UseQueryResult<Account[]>);
    jest.spyOn(useSplitsHook, 'useSplits').mockReturnValue({
      data: splits,
    } as query.UseQueryResult<Split[]>);
    jest.spyOn(useMainCurrencyHook, 'useMainCurrency').mockReturnValue({
      data: mainCurrency,
    } as query.UseQueryResult<Commodity>);

    renderHook(() => useInvestments());

    expect(useAccountsHook.useAccounts).toBeCalledWith();
    expect(useSplitsHook.useSplits).toBeCalledWith({ type: 'INVESTMENT' });
    expect(query.useQuery).toBeCalledWith({
      queryKey: ['api', 'investments'],
      queryFn: expect.any(Function),
      enabled: true,
      networkMode: 'always',
    });

    const callArgs = (query.useQuery as jest.Mock).mock.calls[0][0];
    callArgs.queryFn();
    expect(queries.getInvestments).toBeCalledWith([account1], mainCurrency, splits);
  });
});
