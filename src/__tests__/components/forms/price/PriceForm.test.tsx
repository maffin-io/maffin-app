import React from 'react';
import { DateTime } from 'luxon';
import {
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataSource } from 'typeorm';

import PriceForm from '@/components/forms/price/PriceForm';
import { Price, Commodity } from '@/book/entities';

describe('PriceForm', () => {
  let datasource: DataSource;
  let eur: Commodity;
  let usd: Commodity;

  // For some reason upsert doesn't play well with re-creating the
  // data source for every test so here we just create it once
  beforeAll(async () => {
    datasource = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [Price, Commodity],
      synchronize: true,
      logging: false,
    });
    await datasource.initialize();

    eur = await Commodity.create({
      mnemonic: 'EUR',
      namespace: 'CURRENCY',
    }).save();

    usd = await Commodity.create({
      mnemonic: 'USD',
      namespace: 'CURRENCY',
    }).save();
  });

  beforeEach(async () => {
    await Price.createQueryBuilder().delete().execute();
  });

  afterAll(async () => {
    await datasource.destroy();
  });

  it('renders as expected with add', async () => {
    const { container } = render(
      <PriceForm
        action="add"
        onSave={() => {}}
      />,
    );

    await screen.findByLabelText('Date');
    screen.getByRole('combobox', { name: 'currencyInput' });
    screen.getByRole('combobox', { name: 'commodityInput' });
    screen.getByLabelText('Price');
    expect(container).toMatchSnapshot();
  });

  it('renders as expected with update', async () => {
    const { container } = render(
      <PriceForm
        action="update"
        onSave={() => {}}
      />,
    );

    await screen.findByLabelText('Date');
    screen.getByLabelText('Price');
    expect(container).toMatchSnapshot();
  });

  it('renders as expected with delete', async () => {
    const { container } = render(
      <PriceForm
        action="delete"
        onSave={() => {}}
      />,
    );

    await screen.findByLabelText('Date');
    screen.getByLabelText('Price');
    expect(container).toMatchSnapshot();
  });

  it('hides when provided with default commodity', async () => {
    render(
      <PriceForm
        action="add"
        onSave={() => {}}
        defaultValues={{
          fk_commodity: eur,
          fk_currency: usd,
        }}
        hideDefaults
      />,
    );

    await screen.findByLabelText('Date');
    screen.getByRole('combobox', { name: 'currencyInput' });
    screen.getByRole('combobox', { name: 'commodityInput' });
    screen.getByLabelText('Price');

    const fieldsets = screen.getAllByRole('group');
    // Can't check with toBeVisible due tailwindcss not being understood by jest
    expect(fieldsets[1]).toHaveClass('hidden');
    expect(fieldsets[2]).toHaveClass('hidden');
  });

  it('adds new Price and saves', async () => {
    const user = userEvent.setup();
    const mockSave = jest.fn();

    render(
      <PriceForm
        action="add"
        onSave={mockSave}
        defaultValues={{
          fk_commodity: eur,
        }}
      />,
    );

    await screen.findByLabelText('Date');

    await user.type(screen.getByLabelText('Date'), '2023-01-01');
    await user.type(screen.getByLabelText('Price'), '100');
    await user.click(screen.getByRole('combobox', { name: 'currencyInput' }));
    await user.click(screen.getByText('USD'));

    expect(screen.getByText('add')).not.toBeDisabled();
    await user.click(screen.getByText('add'));

    const prices = await Price.find();
    expect(prices).toEqual([
      {
        guid: expect.any(String),
        date: DateTime.fromISO('2023-01-01'),
        fk_commodity: eur,
        fk_currency: usd,
        valueDenom: 1,
        valueNum: 100,
        source: null,
      },
    ]);
    expect(mockSave).toBeCalledWith({
      guid: expect.any(String),
      date: DateTime.fromISO('2023-01-01'),
      fk_commodity: eur,
      fk_currency: usd,
      valueDenom: 1,
      valueNum: 100,
    });
  });

  it('upserts when adding same date, commodity and currency', async () => {
    const user = userEvent.setup();
    await Price.create({
      fk_currency: usd,
      fk_commodity: eur,
      date: DateTime.fromISO('2023-01-01'),
      valueNum: 150,
      valueDenom: 1,
    }).save();

    render(
      <PriceForm
        action="add"
        onSave={() => {}}
        defaultValues={{
          fk_commodity: eur,
        }}
      />,
    );

    await screen.findByLabelText('Date');

    await user.type(screen.getByLabelText('Date'), '2023-01-01');
    await user.type(screen.getByLabelText('Price'), '100');
    await user.click(screen.getByRole('combobox', { name: 'currencyInput' }));
    await user.click(screen.getByText('USD'));

    expect(screen.getByText('add')).not.toBeDisabled();
    await user.click(screen.getByText('add'));

    const prices = await Price.find();
    expect(prices).toEqual([
      {
        guid: expect.any(String),
        date: DateTime.fromISO('2023-01-01'),
        fk_commodity: eur,
        fk_currency: usd,
        valueDenom: 1,
        valueNum: 100,
        source: null,
      },
    ]);
  });

  it('updates Price and saves', async () => {
    const user = userEvent.setup();
    const mockSave = jest.fn();
    const price = await Price.create({
      fk_currency: usd,
      fk_commodity: eur,
      date: DateTime.fromISO('2023-01-01'),
      valueNum: 150,
      valueDenom: 1,
    }).save();

    render(
      <PriceForm
        action="update"
        defaultValues={{
          ...price,
          date: price.date.toISODate() as string,
        }}
        onSave={mockSave}
      />,
    );

    const priceInput = screen.getByLabelText('Price');

    await user.clear(priceInput);
    await user.type(priceInput, '120');

    expect(screen.getByText('update')).not.toBeDisabled();
    await user.click(screen.getByText('update'));

    const prices = await Price.find();
    expect(prices).toEqual([
      {
        guid: expect.any(String),
        date: DateTime.fromISO('2023-01-01'),
        fk_commodity: eur,
        fk_currency: usd,
        valueDenom: 1,
        valueNum: 120,
        source: null,
      },
    ]);
    expect(mockSave).toBeCalledWith({
      guid: expect.any(String),
      date: DateTime.fromISO('2023-01-01'),
      fk_commodity: eur,
      fk_currency: usd,
      valueDenom: 1,
      valueNum: 120,
      source: null,
    });
  });
});
