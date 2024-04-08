import React from 'react';
import { DateTime } from 'luxon';
import { render, screen } from '@testing-library/react';

import AddTxDropdown from '@/components/buttons/AddTxDropdown';
import FormButton from '@/components/buttons/FormButton';
import TransactionForm from '@/components/forms/transaction/TransactionForm';
import { Account, Split } from '@/book/entities';

jest.mock('@/components/buttons/FormButton', () => jest.fn(
  (props: React.PropsWithChildren) => (
    <div data-testid="FormButton">
      {props.children}
    </div>
  ),
));

jest.mock('@/components/forms/transaction/TransactionForm', () => jest.fn(
  () => <div data-testid="TransactionForm" />,
));

describe('AddTxDropdown', () => {
  beforeEach(() => {
    jest.spyOn(Split, 'create').mockImplementation(s => s as Split);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders as expected', async () => {
    const account = {
      guid: 'guid',
      path: 'path',
      name: 'account',
      type: 'TYPE',
      parentId: 'parent',
      commodity: {
        mnemonic: 'EUR',
      },
    } as Account;

    const { container } = render(<AddTxDropdown account={account} latestDate={DateTime.now()} />);

    await screen.findAllByTestId('FormButton');
    expect(FormButton).toBeCalledTimes(1);
    expect(FormButton).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        id: 'add-tx',
        modalTitle: 'Add transaction to account',
      }),
      {},
    );
    expect(TransactionForm).toBeCalledTimes(1);
    expect(TransactionForm).nthCalledWith(
      1,
      {
        defaultValues: {
          date: DateTime.now().toISODate(),
          description: '',
          fk_currency: {
            mnemonic: 'EUR',
          },
          splits: [
            expect.objectContaining({
              fk_account: account,
            }),
            {},
          ],
        },
      },
      {},
    );

    expect(container).toMatchSnapshot();
  });

  it('renders as expected for investment account', async () => {
    const account = {
      guid: 'guid',
      path: 'path',
      name: 'account',
      type: 'INVESTMENT',
      parentId: 'parent',
      commodity: {
        mnemonic: 'EUR',
      },
    } as Account;

    const { container } = render(<AddTxDropdown account={account} latestDate={DateTime.now()} />);

    await screen.findAllByTestId('FormButton');

    expect(FormButton).toBeCalledTimes(3);
    expect(TransactionForm).toBeCalledTimes(3);

    expect(FormButton).nthCalledWith(
      1,
      expect.objectContaining({
        id: 'add-tx',
        modalTitle: 'Add transaction to account',
      }),
      {},
    );
    expect(TransactionForm).nthCalledWith(
      1,
      {
        defaultValues: {
          date: DateTime.now().toISODate(),
          description: '',
          fk_currency: {
            mnemonic: 'EUR',
          },
          splits: [
            expect.objectContaining({
              fk_account: account,
            }),
            {},
          ],
        },
      },
      {},
    );

    expect(FormButton).nthCalledWith(
      2,
      expect.objectContaining({
        id: 'add-dividend',
        modalTitle: 'Add dividend to account',
      }),
      {},
    );
    expect(TransactionForm).nthCalledWith(
      2,
      {
        defaultValues: {
          date: DateTime.now().toISODate(),
          description: 'Dividend account',
          fk_currency: {
            mnemonic: 'EUR',
          },
          splits: [
            expect.objectContaining({
              fk_account: account,
              valueNum: 0,
              valueDenom: 1,
              quantityNum: 0,
              quantityDenom: 1,
            }),
            {
              fk_account: {
                type: 'INCOME',
              },
            },
            {
              fk_account: {
                type: 'ASSET',
              },
            },
          ],
        },
      },
      {},
    );

    expect(FormButton).nthCalledWith(
      3,
      expect.objectContaining({
        id: 'add-split',
        modalTitle: 'Add split event to account',
      }),
      {},
    );
    expect(TransactionForm).nthCalledWith(
      3,
      {
        defaultValues: {
          date: DateTime.now().toISODate(),
          description: 'Split account',
          fk_currency: {
            mnemonic: 'EUR',
          },
          splits: [
            expect.objectContaining({
              fk_account: account,
              valueNum: 0,
              valueDenom: 1,
              quantityNum: 0,
              quantityDenom: 1,
            }),
          ],
        },
      },
      {},
    );

    expect(container).toMatchSnapshot();
  });
});
