import React from 'react';
import { render, screen } from '@testing-library/react';
import type { SWRResponse } from 'swr';

import Selector from '@/components/selectors/Selector';
import { Account, Commodity } from '@/book/entities';
import { AccountSelector } from '@/components/selectors';
import * as apiHook from '@/hooks/useApi';

jest.mock('@/components/selectors/Selector', () => jest.fn(
  () => <div data-testid="Selector" />,
));

jest.mock('@/hooks/useApi', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useApi'),
}));

describe('AccountSelector', () => {
  beforeEach(() => {
    jest.spyOn(apiHook, 'default').mockReturnValue({ data: {} } as SWRResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders as expected', async () => {
    const { container } = render(<AccountSelector />);

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      {
        id: 'accountSelector',
        isClearable: true,
        disabled: false,
        defaultValue: undefined,
        className: '',
        labelAttribute: 'path',
        options: [],
        placeholder: 'Choose account',
        onChange: expect.any(Function),
      },
      {},
    );
    expect(container).toMatchSnapshot();
  });

  it('passes data as expected', async () => {
    jest.spyOn(apiHook, 'default').mockReturnValue(
      {
        data: {
          guid: {
            guid: 'guid',
            path: 'label1',
          } as Account,
        },
      } as SWRResponse,
    );
    const mockOnSave = jest.fn();
    const { container } = render(
      <AccountSelector
        id="customId"
        placeholder="My placeholder"
        isClearable={false}
        className="class"
        defaultValue={{ guid: 'guid', path: 'label1' } as Account}
        onChange={mockOnSave}
      />,
    );

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      {
        id: 'customId',
        isClearable: false,
        disabled: false,
        defaultValue: { guid: 'guid', path: 'label1' },
        className: 'class',
        labelAttribute: 'path',
        options: [{ guid: 'guid', path: 'label1' }],
        placeholder: 'My placeholder',
        onChange: mockOnSave,
      },
      {},
    );
    expect(container).toMatchSnapshot();
  });

  it('loads accounts and passes as options', async () => {
    const options = [
      {
        guid: 'guid1',
        path: 'path1',
        type: 'TYPE1',
        commodity: {
          mnemonic: 'USD',
        } as Commodity,
      } as Account,
      {
        guid: 'guid2',
        path: 'path2',
        type: 'TYPE2',
        commodity: {
          mnemonic: 'USD',
        } as Commodity,
      } as Account,
    ];
    jest.spyOn(apiHook, 'default').mockReturnValue(
      {
        data: {
          guid1: options[0],
          guid2: options[1],
        },
      } as SWRResponse,
    );

    render(<AccountSelector />);

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      expect.objectContaining({
        options,
      }),
      {},
    );
  });

  it('filters accounts', async () => {
    const options = [
      {
        guid: 'guid1',
        path: 'path1',
        type: 'TYPE1',
        commodity: {
          mnemonic: 'USD',
        } as Commodity,
      } as Account,
      {
        guid: 'guid2',
        path: 'path2',
        type: 'TYPE2',
        commodity: {
          mnemonic: 'USD',
        } as Commodity,
      } as Account,
    ];
    jest.spyOn(apiHook, 'default').mockReturnValue(
      {
        data: {
          guid1: options[0],
          guid2: options[1],
        },
      } as SWRResponse,
    );

    render(
      <AccountSelector
        ignoreAccounts={['TYPE2']}
      />,
    );

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [options[0]],
      }),
      {},
    );
  });

  it('filters ROOT by default', async () => {
    const options = [
      {
        guid: 'guid1',
        path: 'path1',
        type: 'ROOT',
        commodity: {
          mnemonic: 'USD',
        } as Commodity,
      } as Account,
      {
        guid: 'guid2',
        path: 'path2',
        type: 'TYPE2',
        commodity: {
          mnemonic: 'USD',
        } as Commodity,
      } as Account,
    ];
    jest.spyOn(apiHook, 'default').mockReturnValue(
      {
        data: {
          guid1: options[0],
          guid2: options[1],
        },
      } as SWRResponse,
    );

    render(<AccountSelector />);

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [options[1]],
      }),
      {},
    );
  });

  it('shows root when specified', async () => {
    const options = [
      {
        guid: 'guid1',
        path: 'path1',
        type: 'ROOT',
        commodity: {
          mnemonic: 'USD',
        } as Commodity,
      } as Account,
      {
        guid: 'guid2',
        path: 'path2',
        type: 'TYPE2',
        commodity: {
          mnemonic: 'USD',
        } as Commodity,
      } as Account,
    ];
    jest.spyOn(apiHook, 'default').mockReturnValue(
      {
        data: {
          guid1: options[0],
          guid2: options[1],
        },
      } as SWRResponse,
    );

    render(<AccountSelector showRoot />);

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      expect.objectContaining({
        options,
      }),
      {},
    );
  });
});
