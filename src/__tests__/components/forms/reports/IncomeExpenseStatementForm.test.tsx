import React from 'react';
import {
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DefinedUseQueryResult, QueryClientProvider } from '@tanstack/react-query';
import type { Interval } from 'luxon';

import IncomeExpenseStatementForm from '@/components/forms/reports/IncomeExpenseStatementForm';
import IncomeExpenseStatementExcel from '@/templates/excel/IncomeExpenseStatement';
import downloadBlob from '@/helpers/downloadBlob';
import * as stateHooks from '@/hooks/state';

jest.mock('@/hooks/state', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/state'),
}));

jest.mock('@/components/DateRangeInput', () => jest.fn(
  () => <input id="intervalInput" data-testid="DateRangeInput" />,
));

jest.mock('@/templates/excel/IncomeExpenseStatement', () => jest.fn());

jest.mock('@/helpers/downloadBlob', () => jest.fn());

const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={QUERY_CLIENT}>{children}</QueryClientProvider>
);

describe('IncomeExpenseStatementForm', () => {
  beforeEach(async () => {
    jest.spyOn(stateHooks, 'useInterval').mockReturnValue({ data: TEST_INTERVAL } as DefinedUseQueryResult<Interval>);
  });

  afterEach(async () => {
    jest.resetAllMocks();
  });

  it('renders as expected', async () => {
    const { container } = render(<IncomeExpenseStatementForm />, { wrapper });

    screen.getByLabelText('Select dates');
    expect(screen.getByLabelText('PDF')).toBeChecked();
    expect(screen.getByLabelText('Excel')).not.toBeChecked();
    expect(container).toMatchSnapshot();
  });

  it('downloads an excel file when Excel format is selected', async () => {
    const user = userEvent.setup();
    const blob = new Blob(['xlsx']);
    (IncomeExpenseStatementExcel as jest.Mock).mockResolvedValue(blob);
    render(<IncomeExpenseStatementForm />, { wrapper });

    await user.click(screen.getByLabelText('Excel'));
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(downloadBlob).toHaveBeenCalledWith(
      blob,
      `income-statement_${TEST_INTERVAL.toISODate().replace('/', '_')}.xlsx`,
    ));
    expect(IncomeExpenseStatementExcel).toHaveBeenCalledWith(
      expect.objectContaining({ interval: TEST_INTERVAL }),
    );
  });
});
