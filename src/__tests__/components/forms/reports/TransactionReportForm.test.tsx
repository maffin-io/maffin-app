import React from 'react';
import {
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DefinedUseQueryResult, QueryClientProvider, UseQueryResult } from '@tanstack/react-query';
import type { Interval } from 'luxon';

import TransactionReportForm from '@/components/forms/reports/TransactionReportForm';
import TransactionReportExcel from '@/templates/excel/TransactionReport';
import downloadBlob from '@/helpers/downloadBlob';
import type { Transaction } from '@/book/entities';
import * as stateHooks from '@/hooks/state';
import * as apiHooks from '@/hooks/api';

jest.mock('@/hooks/state', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/state'),
}));

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

jest.mock('@/components/DateRangeInput', () => jest.fn(
  () => <input id="intervalInput" data-testid="DateRangeInput" />,
));

jest.mock('@/templates/excel/TransactionReport', () => jest.fn());

jest.mock('@/helpers/downloadBlob', () => jest.fn());

const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={QUERY_CLIENT}>{children}</QueryClientProvider>
);

describe('TransactionReportForm', () => {
  beforeEach(async () => {
    jest.spyOn(stateHooks, 'useInterval').mockReturnValue({ data: TEST_INTERVAL } as DefinedUseQueryResult<Interval>);
  });

  afterEach(async () => {
    jest.resetAllMocks();
  });

  it('renders as expected', async () => {
    const { container } = render(<TransactionReportForm />, { wrapper });

    screen.getByLabelText('Select dates');
    expect(screen.queryByTestId('orphan-warning')).not.toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('shows a warning when there are orphan transactions', async () => {
    jest.spyOn(apiHooks, 'useTransactionsReport').mockReturnValue({
      data: [
        { guid: 'tx1', splits: [{ account: null }, { account: { type: 'EQUITY' } }] },
        { guid: 'tx2', splits: [{ account: { type: 'EXPENSE' } }] },
      ],
    } as unknown as UseQueryResult<Transaction[]>);

    render(<TransactionReportForm />, { wrapper });

    expect(screen.getByTestId('orphan-warning')).toHaveTextContent(
      '1 transaction(s) in this period reference deleted accounts',
    );
  });

  it('downloads an excel file when Excel format is selected', async () => {
    const user = userEvent.setup();
    const blob = new Blob(['xlsx']);
    (TransactionReportExcel as jest.Mock).mockResolvedValue(blob);
    jest.spyOn(apiHooks, 'useTransactionsReport').mockReturnValue(
      { data: [] } as unknown as UseQueryResult<Transaction[]>,
    );
    render(<TransactionReportForm />, { wrapper });

    expect(screen.getByLabelText('PDF')).toBeChecked();
    await user.click(screen.getByLabelText('Excel'));
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(downloadBlob).toHaveBeenCalledWith(
      blob,
      `transaction-report_${TEST_INTERVAL.toISODate().replace('/', '_')}.xlsx`,
    ));
    expect(TransactionReportExcel).toHaveBeenCalledWith(
      expect.objectContaining({ interval: TEST_INTERVAL }),
    );
  });
});
