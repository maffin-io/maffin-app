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
    jest.spyOn(Split, 'create').mockReturnValue({ guid: 'createdSplit' } as Split);
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
    expect(FormButton).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        id: 'add-tx',
        modalTitle: 'Add transaction to account',
      }),
      {},
    );
    expect(TransactionForm).toBeCalledWith(
      {
        defaultValues: {
          date: DateTime.now().toISODate(),
          description: '',
          fk_currency: {
            mnemonic: 'EUR',
          },
          splits: [
            { guid: 'createdSplit' },
            {
              action: '',
              guid: expect.any(String),
            },
          ],
        },
      },
      {},
    );

    expect(container).toMatchSnapshot();
  });
});
