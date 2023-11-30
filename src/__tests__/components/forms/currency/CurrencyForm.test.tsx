import React from 'react';
import {
  render,
  screen,
} from '@testing-library/react';
import { DataSource } from 'typeorm';
import userEvent from '@testing-library/user-event';

import CurrencyForm from '@/components/forms/currency/CurrencyForm';
import { Commodity } from '@/book/entities';

describe('CurrencyForm', () => {
  let datasource: DataSource;

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Commodity],
      synchronize: true,
      logging: false,
    });
    await datasource.initialize();
  });

  afterEach(async () => {
    await datasource.destroy();
  });

  it('renders as expected', async () => {
    const { container } = render(
      <CurrencyForm
        onSave={() => {}}
      />,
    );

    await screen.findByText('Choose or type your currency');
    screen.getByRole('combobox', { name: 'currency-selector' });
    expect(container).toMatchSnapshot();
  });

  it('creates selected currency and calls on save', async () => {
    const mockSave = jest.fn();
    const user = userEvent.setup();
    render(
      <CurrencyForm
        onSave={mockSave}
      />,
    );

    const input = await screen.findByRole('combobox', { name: 'currency-selector' });
    await user.click(input);
    await user.click(screen.getByText('EUR'));
    await user.click(screen.getByText('Save'));

    const commodities = await Commodity.find();
    expect(commodities).toEqual([
      {
        guid: expect.any(String),
        mnemonic: 'EUR',
        fullname: '',
        namespace: 'CURRENCY',
        cusip: null,
      },
    ]);
    expect(mockSave).toBeCalledWith(commodities[0]);
  });
});
