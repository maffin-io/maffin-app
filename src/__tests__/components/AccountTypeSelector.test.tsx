import React from 'react';
import {
  render,
  screen,
  fireEvent,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AccountTypeSelector from '@/components/AccountTypeSelector';

describe('AccountTypeSelector', () => {
  it('renders as expected', async () => {
    const { container } = render(
      <AccountTypeSelector
        onChange={jest.fn()}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  it('shows default placeholder', async () => {
    render(
      <AccountTypeSelector
        onChange={jest.fn()}
      />,
    );

    screen.getByText('Choose account type');
  });

  it('shows placeholder', async () => {
    render(
      <AccountTypeSelector
        placeholder="My placeholder"
        onChange={jest.fn()}
      />,
    );

    screen.getByText('My placeholder');
  });

  it('displays expected types', async () => {
    render(
      <AccountTypeSelector
        id="testSelector"
        onChange={jest.fn()}
      />,
    );

    const select = screen.getByLabelText('testSelector');
    await userEvent.click(select);

    screen.getByText('ASSET');
    screen.getByText('BANK');
    screen.getByText('CASH');
    screen.getByText('EQUITY');
    screen.getByText('LIABILITY');
    screen.getByText('INCOME');
    screen.getByText('EXPENSE');
    screen.getByText('STOCK');
    screen.getByText('MUTUAL');
    expect(screen.queryByText('ROOT')).toBeNull();
  });

  it('removes focus on ESC', async () => {
    render(
      <AccountTypeSelector
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
    render(
      <AccountTypeSelector
        id="testSelector"
        onChange={jest.fn()}
      />,
    );

    const select = screen.getByLabelText('testSelector');
    await userEvent.click(select);
    await userEvent.click(screen.getByText('ASSET'));

    expect(screen.queryByText('Choose account type')).toBeNull();
    await userEvent.type(select, '{backspace}');

    screen.getByText('Choose account type');
  });

  it('displays filtered types', async () => {
    render(
      <AccountTypeSelector
        ignoreTypes={['STOCK', 'MUTUAL']}
        id="testSelector"
        onChange={jest.fn()}
      />,
    );

    const select = screen.getByLabelText('testSelector');
    await userEvent.click(select);

    screen.getByText('ASSET');
    expect(screen.queryByText('STOCK')).toBeNull();
    expect(screen.queryByText('MUTUAL')).toBeNull();
  });

  it('calls custom onChange and sets selected', async () => {
    const mockOnChange = jest.fn();
    render(
      <AccountTypeSelector
        id="testSelector"
        onChange={mockOnChange}
      />,
    );

    const select = screen.getByLabelText('testSelector');
    await userEvent.click(select);

    await userEvent.click(screen.getByText('ASSET'));

    expect(mockOnChange).toHaveBeenCalledWith('ASSET');
  });
});
