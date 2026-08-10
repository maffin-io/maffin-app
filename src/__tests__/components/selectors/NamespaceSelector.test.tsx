import React from 'react';
import { render, screen } from '@testing-library/react';

import Selector from '@/components/selectors/Selector';
import { NamespaceSelector } from '@/components/selectors';

jest.mock('@/components/selectors/Selector', () => jest.fn(
  () => <div data-testid="Selector" />,
));

describe('NamespaceSelector', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates Selector with defaults', async () => {
    render(<NamespaceSelector />);

    await screen.findByTestId('Selector');
    expect(Selector).toHaveBeenCalledWith(
      {
        id: 'namespaceSelector',
        options: [
          { namespace: 'CURRENCY' },
          { namespace: 'STOCK' },
          { namespace: 'FUND' },
          { namespace: 'OTHER' },
        ],
        placeholder: 'Choose namespace',
        getOptionLabel: expect.any(Function),
        getOptionValue: expect.any(Function),
        onChange: expect.any(Function),
      },
      undefined,
    );

    expect((Selector as jest.Mock).mock.calls[0][0].getOptionLabel({ namespace: 'n' })).toEqual('n');
    expect((Selector as jest.Mock).mock.calls[0][0].getOptionValue({ namespace: 'n' })).toEqual('n');
  });
});
