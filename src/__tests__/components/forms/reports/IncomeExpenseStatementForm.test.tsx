import React from 'react';
import {
  render,
  screen,
} from '@testing-library/react';
import { DefinedUseQueryResult, QueryClientProvider } from '@tanstack/react-query';
import type { Interval } from 'luxon';

import IncomeExpenseStatementForm from '@/components/forms/reports/IncomeExpenseStatementForm';
import * as stateHooks from '@/hooks/state';

jest.mock('@/hooks/state', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/state'),
}));

jest.mock('@/components/DateRangeInput', () => jest.fn(
  () => <input id="intervalInput" data-testid="DateRangeInput" />,
));

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
    expect(container).toMatchSnapshot();
  });
});
