import React from 'react';
import {
  render,
  screen,
} from '@testing-library/react';
import { DataSource } from 'typeorm';
import userEvent from '@testing-library/user-event';
import type { SWRResponse } from 'swr';

import CurrencyForm from '@/components/forms/currency/CurrencyForm';
import { Commodity } from '@/book/entities';
import * as apiHook from '@/hooks/api';
import * as stocker from '@/apis/Stocker';

jest.mock('@/apis/Stocker', () => ({
  __esModule: true,
  ...jest.requireActual('@/apis/Stocker'),
}));

jest.mock('@/hooks/api', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/api'),
}));

describe('CurrencyForm', () => {
  let datasource: DataSource;
  let eur: Commodity;

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Commodity],
      synchronize: true,
      logging: false,
    });
    await datasource.initialize();

    eur = await Commodity.create({
      namespace: 'CURRENCY',
      mnemonic: 'EUR',
    }).save();

    jest.spyOn(stocker, 'search').mockImplementation();
    jest.spyOn(apiHook, 'useCommodities').mockReturnValue({ data: [eur] } as SWRResponse);
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

    await screen.findByText('Choose or search your currency');
    screen.getByRole('combobox', { name: 'mnemonicInput' });
    expect(container).toMatchSnapshot();
  });

  it('calls on save', async () => {
    const mockSave = jest.fn();
    const user = userEvent.setup();
    render(
      <CurrencyForm
        onSave={mockSave}
      />,
    );

    const input = await screen.findByRole('combobox', { name: 'mnemonicInput' });
    await user.click(input);
    await user.type(input, 'EU');
    const eurOption = await screen.findByText('EUR');
    await user.click(eurOption);

    await user.click(screen.getByText('Save'));

    expect(mockSave).toBeCalledWith(eur);
  });
});
