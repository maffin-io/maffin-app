import React from 'react';
import {
  render,
  screen,
} from '@testing-library/react';

import IncomeExpenseStatementForm from '@/components/forms/reports/IncomeExpenseStatementForm';
import ReportsDropdown from '@/components/buttons/ReportsDropdown';
import FormButton from '@/components/buttons/FormButton';

jest.mock('@/components/buttons/FormButton', () => jest.fn(
  (props: React.PropsWithChildren) => (
    <div data-testid="FormButton">
      {props.children}
    </div>
  ),
));

jest.mock('@/components/forms/reports/IncomeExpenseStatementForm', () => jest.fn(
  () => <div data-testid="IncomeExpenseStatementForm" />,
));

describe('ReportsDropdown', () => {
  beforeEach(async () => {
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders as expected', async () => {
    const { container } = render(<ReportsDropdown />);

    await screen.findAllByTestId('FormButton');
    expect(FormButton).toHaveBeenCalledTimes(1);
    expect(FormButton).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        id: 'IE report',
        modalTitle: 'Income statement',
      }),
      undefined,
    );
    expect(IncomeExpenseStatementForm).toHaveBeenCalledTimes(1);
    expect(IncomeExpenseStatementForm).toHaveBeenNthCalledWith(1, {}, undefined);

    expect(container).toMatchSnapshot();
  });
});
