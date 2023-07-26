import React from 'react';
import { render, screen } from '@testing-library/react';
import { SWRConfig } from 'swr';

import Selector from '@/components/selectors/Selector';
import { Account, Commodity } from '@/book/entities';
import { AccountSelector } from '@/components/selectors';
import * as queries from '@/book/queries';

jest.mock('@/book/queries', () => ({
  __esModule: true,
  ...jest.requireActual('@/book/queries'),
}));

jest.mock('@/components/selectors/Selector', () => jest.fn(
  () => <div data-testid="Selector" />,
));

describe('AccountSelector', () => {
  beforeEach(() => {
    jest.spyOn(queries, 'getAccountsWithPath').mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders as expected', async () => {
    const { container } = render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountSelector />
      </SWRConfig>,
    );

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      {
        id: 'accountSelector',
        isClearable: true,
        disabled: false,
        defaultValue: undefined,
        className: '',
        labelAttribute: 'path',
        options: [],
        placeholder: 'Choose account',
        onChange: expect.any(Function),
      },
      {},
    );
    expect(container).toMatchSnapshot();
  });

  it('passes data as expected', async () => {
    jest.spyOn(queries, 'getAccountsWithPath').mockResolvedValue([
      {
        guid: 'guid',
        path: 'label1',
      } as Account,
    ]);
    const mockOnSave = jest.fn();
    const { container } = render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountSelector
          id="customId"
          placeholder="My placeholder"
          isClearable={false}
          className="class"
          defaultValue={{ guid: 'guid' } as Account}
          onChange={mockOnSave}
        />
      </SWRConfig>,
    );

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      {
        id: 'customId',
        isClearable: false,
        disabled: false,
        defaultValue: { guid: 'guid', path: 'label1' },
        className: 'class',
        labelAttribute: 'path',
        options: [{ guid: 'guid', path: 'label1' }],
        placeholder: 'My placeholder',
        onChange: mockOnSave,
      },
      {},
    );
    expect(container).toMatchSnapshot();
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
    jest.spyOn(queries, 'getAccountsWithPath').mockResolvedValue(options);

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountSelector />
      </SWRConfig>,
    );

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      expect.objectContaining({
        options,
      }),
      {},
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
    jest.spyOn(queries, 'getAccountsWithPath').mockResolvedValue(options);

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountSelector
          ignoreAccounts={['TYPE2']}
        />
      </SWRConfig>,
    );

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [options[0]],
      }),
      {},
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
    jest.spyOn(queries, 'getAccountsWithPath').mockResolvedValue(options);

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountSelector />
      </SWRConfig>,
    );

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [options[1]],
      }),
      {},
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
    jest.spyOn(queries, 'getAccountsWithPath').mockResolvedValue(options);

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountSelector
          showRoot
        />
      </SWRConfig>,
    );

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      expect.objectContaining({
        options,
      }),
      {},
    );
  });

  it('gets accounts once only', async () => {
    const { rerender } = render(
      <AccountSelector />,
    );

    rerender(
      <AccountSelector />,
    );

    await screen.findByTestId('Selector');
    expect(queries.getAccountsWithPath).toHaveBeenCalledTimes(1);
  });
});
