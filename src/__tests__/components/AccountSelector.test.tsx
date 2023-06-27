import React from 'react';
import {
  render,
  screen,
  fireEvent,
} from '@testing-library/react';
import type { DataSource } from 'typeorm';
import userEvent from '@testing-library/user-event';

import { Account, Commodity } from '@/book/entities';
import AccountSelector from '@/components/AccountSelector';
import * as dataSourceHooks from '@/hooks/useDataSource';
import * as queries from '@/book/queries';

jest.mock('@/hooks/useDataSource', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useDataSource'),
}));

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

  it('renders as expected', async () => {
    const { container } = render(
      <AccountSelector
        onChange={jest.fn()}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  it('shows default placeholder', async () => {
    render(
      <AccountSelector
        onChange={jest.fn()}
      />,
    );

    screen.getByText('Choose account');
  });

  it('shows placeholder', async () => {
    render(
      <AccountSelector
        placeholder="My placeholder"
        onChange={jest.fn()}
      />,
    );

    screen.getByText('My placeholder');
  });

  it('displays no matches when loading', async () => {
    render(
      <AccountSelector
        id="testSelector"
        onChange={jest.fn()}
      />,
    );

    const select = screen.getByLabelText('testSelector');
    await userEvent.click(select);

    screen.getByText('No options');
  });

  it('displays accounts when datasource ready', async () => {
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{} as DataSource]);
    render(
      <AccountSelector
        id="testSelector"
        onChange={jest.fn()}
      />,
    );

    const select = screen.getByLabelText('testSelector');
    await userEvent.click(select);

    screen.getByText('path1');
    screen.getByText('path2');
  });

  it('displays accounts with meta+k', async () => {
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{} as DataSource]);
    render(
      <AccountSelector
        id="testSelector"
        onChange={jest.fn()}
      />,
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
      <AccountSelector
        id="testSelector"
        onChange={jest.fn()}
      />,
    );

    const select = screen.getByLabelText('testSelector');
    fireEvent.focus(select);
    expect(select).toHaveFocus();
    await userEvent.keyboard('{Esc}');
    expect(select).not.toHaveFocus();
  });

  it('backspace removes selection', async () => {
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{} as DataSource]);
    render(
      <AccountSelector
        id="testSelector"
        onChange={jest.fn()}
      />,
    );

    const select = screen.getByLabelText('testSelector');
    await userEvent.click(select);
    await userEvent.click(screen.getByText('path1'));

    expect(screen.queryByText('Choose account')).toBeNull();
    await userEvent.type(select, '{backspace}');

    screen.getByText('Choose account');
  });

  it('displays filtered accounts when datasource ready', async () => {
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{} as DataSource]);
    render(
      <AccountSelector
        ignoreAccounts={['TYPE2']}
        id="testSelector"
        onChange={jest.fn()}
      />,
    );

    const select = screen.getByLabelText('testSelector');
    await userEvent.click(select);

    screen.getByText('path1');
    expect(screen.queryByText('path2')).toBeNull();
  });

  it('calls custom onChange and sets selected', async () => {
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{} as DataSource]);
    const mockOnChange = jest.fn();
    render(
      <AccountSelector
        id="testSelector"
        onChange={mockOnChange}
      />,
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
});
