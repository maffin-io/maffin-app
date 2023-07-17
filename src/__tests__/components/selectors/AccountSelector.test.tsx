import React from 'react';
import { render, screen } from '@testing-library/react';
import { SWRConfig } from 'swr';

import Selector, { SelectorProps } from '@/components/selectors/Selector';
import { Account, Commodity } from '@/book/entities';
import { AccountSelector } from '@/components/selectors';
import * as queries from '@/book/queries';

jest.mock('@/book/queries', () => ({
  __esModule: true,
  ...jest.requireActual('@/book/queries'),
}));

jest.mock('@/components/selectors/Selector', () => jest.fn(
  (props: SelectorProps<Account>) => (
    <div data-testid="Selector">
      <span>{JSON.stringify(props)}</span>
    </div>
  ),
));

const SelectorMock = Selector as jest.MockedFunction<typeof Selector>;

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
    expect(SelectorMock).toHaveBeenCalledWith(
      {
        id: 'accountSelector',
        isClearable: true,
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
    const mockOnSave = jest.fn();
    const { container } = render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountSelector
          id="customId"
          placeholder="My placeholder"
          isClearable={false}
          className="class"
          defaultValue={{ path: 'label1' } as Account}
          onChange={mockOnSave}
        />
      </SWRConfig>,
    );

    await screen.findByTestId('Selector');
    expect(SelectorMock).toHaveBeenCalledWith(
      {
        id: 'customId',
        isClearable: false,
        defaultValue: { path: 'label1' },
        className: 'class',
        labelAttribute: 'path',
        options: [],
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
    expect(SelectorMock).toHaveBeenCalledWith(
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
    expect(SelectorMock).toHaveBeenCalledWith(
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
    expect(SelectorMock).toHaveBeenCalledWith(
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
    expect(SelectorMock).toHaveBeenCalledWith(
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
