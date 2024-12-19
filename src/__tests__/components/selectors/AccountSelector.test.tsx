import React from 'react';
import { render, screen } from '@testing-library/react';
import type { UseQueryResult } from '@tanstack/react-query';

import Selector from '@/components/selectors/Selector';
import { Account, Commodity } from '@/book/entities';
import { AccountSelector } from '@/components/selectors';
import * as apiHook from '@/hooks/api';

jest.mock('@/components/selectors/Selector', () => jest.fn(
  () => <div data-testid="Selector" />,
));

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

describe('AccountSelector', () => {
  beforeEach(() => {
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue({ data: undefined } as UseQueryResult<Account[]>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates Selector with defaults', async () => {
    render(<AccountSelector />);

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      {
        id: 'accountSelector',
        options: [],
        placeholder: 'Choose account',
        getOptionLabel: expect.any(Function),
        getOptionValue: expect.any(Function),
        classNames: {
          option: expect.any(Function),
        },
      },
      undefined,
    );

    expect((Selector as jest.Mock).mock.calls[0][0].getOptionLabel({ path: 'path' })).toEqual('path');
    expect((Selector as jest.Mock).mock.calls[0][0].getOptionValue({ path: 'path' })).toEqual('path');
  });

  it('loads accounts and passes as options', async () => {
    const options = [
      {
        guid: 'guid1',
        path: 'path1',
        type: 'TYPE1',
        commodity: {
          mnemonic: 'USD',
        } as Commodity,
      } as Account,
      {
        guid: 'guid2',
        path: 'path2',
        type: 'TYPE2',
        commodity: {
          mnemonic: 'USD',
        } as Commodity,
      } as Account,
    ];
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: options,
      } as UseQueryResult<Account[]>,
    );

    render(<AccountSelector />);

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      expect.objectContaining({
        options,
      }),
      undefined,
    );
  });

  it('filters accounts', async () => {
    const options = [
      {
        guid: 'guid1',
        path: 'path1',
        type: 'TYPE1',
        commodity: {
          mnemonic: 'USD',
        } as Commodity,
      } as Account,
      {
        guid: 'guid2',
        path: 'path2',
        type: 'TYPE2',
        commodity: {
          mnemonic: 'USD',
        } as Commodity,
      } as Account,
    ];
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: options,
      } as UseQueryResult<Account[]>,
    );

    render(
      <AccountSelector
        ignoreAccounts={['guid2']}
      />,
    );

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [options[0]],
      }),
      undefined,
    );
  });

  it('filters ROOT by default', async () => {
    const options = [
      {
        guid: 'guid1',
        path: 'path1',
        type: 'ROOT',
        commodity: {
          mnemonic: 'USD',
        } as Commodity,
      } as Account,
      {
        guid: 'guid2',
        path: 'path2',
        type: 'TYPE2',
        commodity: {
          mnemonic: 'USD',
        } as Commodity,
      } as Account,
    ];
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: options,
      } as UseQueryResult<Account[]>,
    );

    render(<AccountSelector />);

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [options[1]],
      }),
      undefined,
    );
  });

  it('shows root when specified', async () => {
    const options = [
      {
        guid: 'guid1',
        path: 'path1',
        type: 'ROOT',
        commodity: {
          mnemonic: 'USD',
        } as Commodity,
      } as Account,
      {
        guid: 'guid2',
        path: 'path2',
        type: 'TYPE2',
        commodity: {
          mnemonic: 'USD',
        } as Commodity,
      } as Account,
    ];
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: options,
      } as UseQueryResult<Account[]>,
    );

    render(<AccountSelector showRoot />);

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      expect.objectContaining({
        options,
      }),
      undefined,
    );
  });

  it('filters placeholders', async () => {
    const options = [
      {
        guid: 'guid1',
        path: 'path1',
        type: 'ASSET',
        commodity: {
          mnemonic: 'USD',
        } as Commodity,
      } as Account,
      {
        guid: 'guid2',
        path: 'path2',
        type: 'ASSET',
        commodity: {
          mnemonic: 'USD',
        } as Commodity,
        placeholder: true,
      } as Account,
    ];
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: options,
      } as UseQueryResult<Account[]>,
    );

    render(
      <AccountSelector ignorePlaceholders />,
    );

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [options[0]],
      }),
      undefined,
    );
  });

  it('selects placeholders only', async () => {
    const options = [
      {
        guid: 'guid1',
        path: 'path1',
        type: 'ASSET',
        commodity: {
          mnemonic: 'USD',
        } as Commodity,
      } as Account,
      {
        guid: 'guid2',
        path: 'path2',
        type: 'ASSET',
        commodity: {
          mnemonic: 'USD',
        } as Commodity,
        placeholder: true,
      } as Account,
    ];
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: options,
      } as UseQueryResult<Account[]>,
    );

    render(
      <AccountSelector onlyPlaceholders />,
    );

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [options[1]],
      }),
      undefined,
    );
  });

  it('filters hidden by default', async () => {
    const options = [
      {
        guid: 'guid1',
        path: 'path1',
        type: 'ASSET',
        commodity: {
          mnemonic: 'USD',
        } as Commodity,
      } as Account,
      {
        guid: 'guid2',
        path: 'path2',
        type: 'ASSET',
        commodity: {
          mnemonic: 'USD',
        } as Commodity,
        hidden: true,
      } as Account,
    ];
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: options,
      } as UseQueryResult<Account[]>,
    );

    render(
      <AccountSelector />,
    );

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [options[0]],
      }),
      undefined,
    );
  });

  it('filters by type', async () => {
    const options = [
      {
        guid: 'guid1',
        path: 'path1',
        type: 'TYPE1',
        commodity: {
          mnemonic: 'USD',
        } as Commodity,
      } as Account,
      {
        guid: 'guid2',
        path: 'path2',
        type: 'TYPE2',
        commodity: {
          mnemonic: 'USD',
        } as Commodity,
      } as Account,
    ];
    jest.spyOn(apiHook, 'useAccounts').mockReturnValue(
      {
        data: options,
      } as UseQueryResult<Account[]>,
    );

    render(
      <AccountSelector
        onlyTypes={['TYPE1']}
      />,
    );

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [options[0]],
      }),
      undefined,
    );
  });
});
