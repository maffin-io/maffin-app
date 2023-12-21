import React from 'react';
import { render } from '@testing-library/react';

import { InvestmentInfo } from '@/components/pages/account';
import InvestmentChart from '@/components/pages/account/InvestmentChart';
import { Account } from '@/book/entities';

jest.mock('@/components/pages/account/InvestmentChart', () => jest.fn(
  () => <div data-testid="InvestmentChart" />,
));

describe('InvestmentInfo', () => {
  it('renders as expected', () => {
    const account = {
      guid: 'guid',
      commodity: {
        guid: 'eur_guid',
        mnemonic: 'EUR',
      },
    } as Account;
    const { container } = render(
      <InvestmentInfo account={account} />,
    );

    expect(InvestmentChart).toBeCalledWith(
      {
        account,
      },
      {},
    );
    expect(container).toMatchSnapshot();
  });
});
