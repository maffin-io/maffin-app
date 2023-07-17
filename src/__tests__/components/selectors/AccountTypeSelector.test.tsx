import React from 'react';
import { render, screen } from '@testing-library/react';
import { SWRConfig } from 'swr';

import Selector, { SelectorProps } from '@/components/selectors/Selector';
import { AccountTypeSelector } from '@/components/selectors';

jest.mock('@/components/selectors/Selector', () => jest.fn(
  (props: SelectorProps<{ type: string }>) => (
    <div data-testid="Selector">
      <span>{JSON.stringify(props)}</span>
    </div>
  ),
));

const SelectorMock = Selector as jest.MockedFunction<typeof Selector>;

describe('AccountTypeSelector', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders as expected', async () => {
    const { container } = render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountTypeSelector />
      </SWRConfig>,
    );

    await screen.findByTestId('Selector');
    expect(SelectorMock).toHaveBeenCalledWith(
      {
        id: 'typeSelector',
        isClearable: true,
        defaultValue: undefined,
        className: '',
        disabled: false,
        labelAttribute: 'type',
        options: [
          { type: 'ASSET' },
          { type: 'BANK' },
          { type: 'CASH' },
          { type: 'EQUITY' },
          { type: 'LIABILITY' },
          { type: 'INCOME' },
          { type: 'EXPENSE' },
          { type: 'MUTUAL' },
          { type: 'STOCK' },
        ],
        placeholder: 'Choose account type',
        onChange: expect.any(Function),
      },
      {},
    );
    expect(container).toMatchSnapshot();
  });

  it('passes data as expected', async () => {
    const mockOnChange = jest.fn();
    const { container } = render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountTypeSelector
          id="customId"
          placeholder="My placeholder"
          isClearable={false}
          disabled
          className="class"
          defaultValue={{ type: 'ASSET' }}
          onChange={mockOnChange}
        />
      </SWRConfig>,
    );

    await screen.findByTestId('Selector');
    expect(SelectorMock).toHaveBeenCalledWith(
      {
        id: 'customId',
        isClearable: false,
        disabled: true,
        defaultValue: { type: 'ASSET' },
        className: 'class',
        labelAttribute: 'type',
        options: [
          { type: 'ASSET' },
          { type: 'BANK' },
          { type: 'CASH' },
          { type: 'EQUITY' },
          { type: 'LIABILITY' },
          { type: 'INCOME' },
          { type: 'EXPENSE' },
          { type: 'MUTUAL' },
          { type: 'STOCK' },
        ],
        placeholder: 'My placeholder',
        onChange: expect.any(Function),
      },
      {},
    );
    const { onChange } = SelectorMock.mock.calls[0][0];
    if (onChange) {
      onChange({ type: 'ASSET' });
    }
    expect(mockOnChange).toHaveBeenCalledWith('ASSET');
    expect(container).toMatchSnapshot();
  });

  it('filters types', async () => {
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountTypeSelector
          ignoreTypes={['ASSET', 'BANK']}
        />
      </SWRConfig>,
    );

    await screen.findByTestId('Selector');
    expect(SelectorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [
          { type: 'CASH' },
          { type: 'EQUITY' },
          { type: 'LIABILITY' },
          { type: 'INCOME' },
          { type: 'EXPENSE' },
          { type: 'MUTUAL' },
          { type: 'STOCK' },
        ],
      }),
      {},
    );
  });
});
