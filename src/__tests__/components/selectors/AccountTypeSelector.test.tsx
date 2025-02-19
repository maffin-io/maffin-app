import React from 'react';
import { render, screen } from '@testing-library/react';

import Selector from '@/components/selectors/Selector';
import { AccountTypeSelector } from '@/components/selectors';

jest.mock('@/components/selectors/Selector', () => jest.fn(
  () => <div data-testid="Selector" />,
));

describe('AccountTypeSelector', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates Selector with defaults', async () => {
    render(<AccountTypeSelector />);

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      {
        id: 'typeSelector',
        options: [
          { type: 'EQUITY' },
          { type: 'INCOME' },
          { type: 'EXPENSE' },
          { type: 'ASSET' },
          { type: 'BANK' },
          { type: 'CASH' },
          { type: 'FIXED' },
          { type: 'INVESTMENT' },
          { type: 'RECEIVABLE' },
          { type: 'LIABILITY' },
          { type: 'CREDIT' },
          { type: 'PAYABLE' },
        ],
        placeholder: 'Choose account type',
        getOptionLabel: expect.any(Function),
        getOptionValue: expect.any(Function),
        onChange: expect.any(Function),
      },
      undefined,
    );

    expect((Selector as jest.Mock).mock.calls[0][0].getOptionLabel({ type: 'type' })).toEqual('type');
    expect((Selector as jest.Mock).mock.calls[0][0].getOptionValue({ type: 'type' })).toEqual('type');
  });

  it('filters types', async () => {
    render(<AccountTypeSelector ignoreTypes={['ASSET', 'BANK']} />);

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [
          { type: 'EQUITY' },
          { type: 'INCOME' },
          { type: 'EXPENSE' },
          { type: 'CASH' },
          { type: 'FIXED' },
          { type: 'INVESTMENT' },
          { type: 'RECEIVABLE' },
          { type: 'LIABILITY' },
          { type: 'CREDIT' },
          { type: 'PAYABLE' },
        ],
      }),
      undefined,
    );
  });
});
