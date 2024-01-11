import React from 'react';
import {
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataSource } from 'typeorm';
import * as swr from 'swr';

import CommodityForm from '@/components/forms/commodity/CommodityForm';
import { Commodity } from '@/book/entities';

jest.mock('swr');

describe('CommodityForm', () => {
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
    jest.resetAllMocks();
    await datasource.destroy();
  });

  it('renders as expected with add', async () => {
    const { container } = render(
      <CommodityForm
        action="add"
        onSave={() => {}}
      />,
    );

    screen.getByLabelText('Code');
    screen.getByLabelText('Name');
    screen.getByRole('combobox', { name: 'namespaceInput' });
    expect(container).toMatchSnapshot();
  });

  it('renders as expected with update', async () => {
    const { container } = render(
      <CommodityForm
        action="update"
        onSave={() => {}}
      />,
    );

    screen.getByLabelText('Code');
    screen.getByLabelText('Name');
    screen.getByRole('combobox', { name: 'namespaceInput' });
    expect(container).toMatchSnapshot();
  });

  it('renders as expected with delete', async () => {
    const { container } = render(
      <CommodityForm
        action="delete"
        onSave={() => {}}
      />,
    );

    expect(screen.getByLabelText('Code')).toBeDisabled();
    expect(screen.getByLabelText('Name')).toBeDisabled();
    expect(container).toMatchSnapshot();
  });

  it('adds new Commodity and saves', async () => {
    const user = userEvent.setup();
    const mockSave = jest.fn();

    render(
      <CommodityForm
        action="add"
        onSave={mockSave}
      />,
    );

    await user.type(screen.getByLabelText('Code'), 'EUR');
    await user.type(screen.getByLabelText('Name'), 'Euro');
    await user.click(screen.getByRole('combobox', { name: 'namespaceInput' }));
    await user.click(screen.getByText('CURRENCY'));

    expect(screen.getByText('add')).not.toBeDisabled();
    await user.click(screen.getByText('add'));

    const commodities = await Commodity.find();
    expect(commodities).toEqual([
      {
        guid: expect.any(String),
        mnemonic: 'EUR',
        fullname: 'Euro',
        namespace: 'CURRENCY',
        cusip: null,
      },
    ]);
    expect(mockSave).toBeCalledWith({
      guid: expect.any(String),
      mnemonic: 'EUR',
      fullname: 'Euro',
      namespace: 'CURRENCY',
      cusip: null,
    });
  });

  it('updates Commodity and saves', async () => {
    const user = userEvent.setup();
    const mockSave = jest.fn();
    const eur = await Commodity.create({
      mnemonic: 'EUR',
      fullname: 'Euro',
      namespace: 'CURRENCY',
    }).save();

    render(
      <CommodityForm
        action="update"
        defaultValues={{ ...eur }}
        onSave={mockSave}
      />,
    );

    const nameInput = screen.getByLabelText('Name');

    await user.clear(nameInput);
    await user.type(nameInput, 'Eurooo');

    expect(screen.getByText('update')).not.toBeDisabled();
    await user.click(screen.getByText('update'));

    const commodities = await Commodity.find();
    expect(commodities).toEqual([
      {
        guid: expect.any(String),
        mnemonic: 'EUR',
        fullname: 'Eurooo',
        namespace: 'CURRENCY',
        cusip: null,
      },
    ]);
    expect(mockSave).toBeCalledWith({
      guid: expect.any(String),
      mnemonic: 'EUR',
      fullname: 'Eurooo',
      namespace: 'CURRENCY',
      cusip: null,
    });
    expect(swr.mutate).toBeCalledTimes(2);
    expect(swr.mutate).toHaveBeenNthCalledWith(1, `/api/commodities/${commodities[0].guid}`);
    expect(swr.mutate).toHaveBeenNthCalledWith(2, '/api/commodities');
  });
});
