import React from 'react';
import {
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataSource } from 'typeorm';
import * as swr from 'swr';
import type { SWRResponse } from 'swr';

import {
  Account,
  Commodity,
  Price,
  Split,
  Transaction,
} from '@/book/entities';
import CommodityForm from '@/components/forms/commodity/CommodityForm';

jest.mock('swr');

describe('CommodityForm', () => {
  let datasource: DataSource;

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Account, Commodity, Price, Split, Transaction],
      synchronize: true,
      logging: false,
    });
    await datasource.initialize();
  });

  afterEach(async () => {
    jest.resetAllMocks();
    await datasource.destroy();
  });

  it('renders as expected', async () => {
    const { container } = render(
      <CommodityForm
        onSave={() => {}}
      />,
    );

    expect(screen.getByRole('combobox', { name: 'mnemonicInput' })).not.toBeNull();
    expect(container).toMatchSnapshot();
  });

  it('button is disabled when form not valid', async () => {
    render(
      <CommodityForm
        onSave={() => {}}
      />,
    );

    const button = await screen.findByText('Save');
    expect(button).toBeDisabled();
  });

  it('creates account with expected params, mutates and saves', async () => {
    const user = userEvent.setup();
    const mockSave = jest.fn();

    render(
      <CommodityForm
        onSave={mockSave}
      />,
    );

    await user.click(screen.getByRole('combobox', { name: 'mnemonicInput' }));
    await user.click(screen.getByText('EUR'));

    expect(screen.getByText('Save')).not.toBeDisabled();
    await user.click(screen.getByText('Save'));

    const currency = await Commodity.findOneByOrFail({ mnemonic: 'EUR' });
    expect(currency).toEqual({
      guid: expect.any(String),
      cusip: null,
      mnemonic: 'EUR',
      namespace: 'CURRENCY',
    });
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(swr.mutate).toBeCalledTimes(1);
    expect(swr.mutate).toBeCalledWith('/api/main-currency', currency);
  });
});
