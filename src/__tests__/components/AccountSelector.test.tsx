import React from 'react';
import {
  render,
  screen,
  fireEvent,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SWRConfig } from 'swr';

import { Account, Commodity } from '@/book/entities';
import AccountSelector from '@/components/AccountSelector';
import * as queries from '@/book/queries';

jest.mock('@/book/queries', () => ({
  __esModule: true,
  ...jest.requireActual('@/book/queries'),
}));

describe('AccountSelector', () => {
  beforeEach(() => {
    jest.spyOn(queries, 'getAccountsWithPath').mockResolvedValue([
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
    ]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders as expected', async () => {
    const { container } = render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountSelector
          onChange={jest.fn()}
        />
      </SWRConfig>,
    );

    await screen.findByLabelText('accountSelector');
    expect(container).toMatchSnapshot();
  });

  it('shows default placeholder', async () => {
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountSelector
          onChange={jest.fn()}
        />
      </SWRConfig>,
    );

    await screen.findByText('Choose account');
  });

  it('shows placeholder', async () => {
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountSelector
          placeholder="My placeholder"
          onChange={jest.fn()}
        />
      </SWRConfig>,
    );

    await screen.findByText('My placeholder');
  });

  it('displays no matches when loading', async () => {
    jest.spyOn(queries, 'getAccountsWithPath').mockResolvedValue([]);

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountSelector
          id="testSelector"
          onChange={jest.fn()}
        />
      </SWRConfig>,
    );

    const select = screen.getByLabelText('testSelector');
    await userEvent.click(select);

    screen.getByText('No options');
  });

  it('displays accounts when datasource ready', async () => {
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountSelector
          id="testSelector"
          onChange={jest.fn()}
        />
      </SWRConfig>,
    );

    const select = screen.getByLabelText('testSelector');
    await userEvent.click(select);

    screen.getByText('path1');
    screen.getByText('path2');
  });

  it('displays accounts with meta+k', async () => {
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountSelector
          id="testSelector"
          onChange={jest.fn()}
        />
      </SWRConfig>,
    );

    const select = screen.getByLabelText('testSelector');
    expect(select).not.toHaveFocus();
    await userEvent.keyboard('{Meta>}k{/Meta}');
    expect(select).toHaveFocus();
    // For some reason, the above is adding k to input box so we delete it
    await userEvent.type(select, '{backspace}p');

    screen.getByText('path1');
    screen.getByText('path2');
  });

  it('removes focus on ESC', async () => {
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountSelector
          id="testSelector"
          onChange={jest.fn()}
        />
      </SWRConfig>,
    );

    const select = screen.getByLabelText('testSelector');
    fireEvent.focus(select);
    expect(select).toHaveFocus();
    await userEvent.keyboard('{Esc}');
    expect(select).not.toHaveFocus();
  });

  it('backspace removes selection', async () => {
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountSelector
          id="testSelector"
          onChange={jest.fn()}
        />
      </SWRConfig>,
    );

    const select = screen.getByLabelText('testSelector');
    await userEvent.click(select);
    await userEvent.click(screen.getByText('path1'));

    expect(screen.queryByText('Choose account')).toBeNull();
    await userEvent.type(select, '{backspace}');

    screen.getByText('Choose account');
  });

  it('displays filtered accounts when datasource ready', async () => {
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountSelector
          ignoreAccounts={['TYPE2']}
          id="testSelector"
          onChange={jest.fn()}
        />
      </SWRConfig>,
    );

    const select = screen.getByLabelText('testSelector');
    await userEvent.click(select);

    screen.getByText('path1');
    expect(screen.queryByText('path2')).toBeNull();
  });

  it('calls custom onChange and sets selected', async () => {
    const mockOnChange = jest.fn();
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountSelector
          id="testSelector"
          onChange={mockOnChange}
        />
      </SWRConfig>,
    );

    const select = screen.getByLabelText('testSelector');
    await userEvent.click(select);

    await userEvent.click(screen.getByText('path1'));

    expect(mockOnChange).toHaveBeenCalledWith({
      guid: 'guid1',
      path: 'path1',
      type: 'TYPE1',
      commodity: {
        mnemonic: 'USD',
      },
    });
  });

  it('gets accounts once only', async () => {
    const { rerender } = render(
      <AccountSelector
        ignoreAccounts={['TYPE2']}
        id="testSelector"
        onChange={jest.fn()}
      />,
    );

    rerender(
      <AccountSelector
        ignoreAccounts={['TYPE2']}
        id="testSelector"
        onChange={jest.fn()}
      />,
    );

    await screen.findByLabelText('accountSelector');
    expect(queries.getAccountsWithPath).toHaveBeenCalledTimes(1);
  });
});
