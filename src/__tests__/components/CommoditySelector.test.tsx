import React from 'react';
import {
  render,
  screen,
  fireEvent,
} from '@testing-library/react';
import type { DataSource } from 'typeorm';
import userEvent from '@testing-library/user-event';

import { Commodity } from '@/book/entities';
import CommoditySelector from '@/components/CommoditySelector';
import * as dataSourceHooks from '@/hooks/useDataSource';

jest.mock('@/hooks/useDataSource', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useDataSource'),
}));

describe('AccountSelector', () => {
  beforeEach(() => {
    jest.spyOn(Commodity, 'find').mockResolvedValue([
      {
        mnemonic: 'EUR',
        namespace: 'CURRENCY',
      } as Commodity,
      {
        mnemonic: 'USD',
        namespace: 'CURRENCY',
      } as Commodity,
      {
        mnemonic: 'IDVY.AS',
        namespace: 'AS',
      } as Commodity,
    ]);
  });

  it('renders as expected', async () => {
    const { container } = render(
      <CommoditySelector
        onChange={jest.fn()}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  it('shows default placeholder', async () => {
    render(
      <CommoditySelector
        onChange={jest.fn()}
      />,
    );

    screen.getByText('Choose commodity');
  });

  it('shows placeholder', async () => {
    render(
      <CommoditySelector
        placeholder="My placeholder"
        onChange={jest.fn()}
      />,
    );

    screen.getByText('My placeholder');
  });

  it('displays no matches when loading', async () => {
    render(
      <CommoditySelector
        id="testSelector"
        onChange={jest.fn()}
      />,
    );

    const select = screen.getByLabelText('testSelector');
    await userEvent.click(select);

    screen.getByText('No options');
  });

  it('displays commodities when datasource ready', async () => {
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{} as DataSource]);
    render(
      <CommoditySelector
        id="testSelector"
        onChange={jest.fn()}
      />,
    );

    const select = screen.getByLabelText('testSelector');
    await userEvent.click(select);

    screen.getByText('EUR');
    screen.getByText('USD');
    screen.getByText('IDVY.AS');
  });

  it('removes focus on ESC', async () => {
    render(
      <CommoditySelector
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
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{} as DataSource]);
    render(
      <CommoditySelector
        id="testSelector"
        onChange={jest.fn()}
      />,
    );

    const select = screen.getByLabelText('testSelector');
    await userEvent.click(select);
    await userEvent.click(screen.getByText('EUR'));

    expect(screen.queryByText('Choose commodity')).toBeNull();
    await userEvent.type(select, '{backspace}');

    screen.getByText('Choose commodity');
  });

  it('displays filtered accounts when datasource ready', async () => {
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{} as DataSource]);
    render(
      <CommoditySelector
        ignoreNamespaces={['CURRENCY']}
        id="testSelector"
        onChange={jest.fn()}
      />,
    );

    const select = screen.getByLabelText('testSelector');
    await userEvent.click(select);

    screen.getByText('IDVY.AS');
    expect(screen.queryByText('EUR')).toBeNull();
    expect(screen.queryByText('USD')).toBeNull();
  });

  it('calls custom onChange and sets selected', async () => {
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{} as DataSource]);
    const mockOnChange = jest.fn();
    render(
      <CommoditySelector
        id="testSelector"
        onChange={mockOnChange}
      />,
    );

    const select = screen.getByLabelText('testSelector');
    await userEvent.click(select);

    await userEvent.click(screen.getByText('EUR'));

    expect(mockOnChange).toHaveBeenCalledWith({
      namespace: 'CURRENCY',
      mnemonic: 'EUR',
    });
  });
});
