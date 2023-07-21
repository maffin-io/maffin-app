import React from 'react';
import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import { SWRConfig, mutate } from 'swr';

import SaveButton from '@/components/buttons/SaveButton';
import type { UseDataSourceReturn } from '@/hooks';
import * as dataSourceHooks from '@/hooks/useDataSource';

jest.mock('@/hooks/useDataSource', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useDataSource'),
}));

jest.mock('@/hooks/useBookStorage', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useBookStorage'),
}));

describe('SaveButton', () => {
  it('loads while unavailable datasource', async () => {
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue(
      { isLoaded: false } as UseDataSourceReturn,
    );
    const { container } = render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <SaveButton />
      </SWRConfig>,
    );

    await screen.findByText('...');
    expect(container).toMatchSnapshot();
  });

  it('renders as expected when datasource ready and not saving', async () => {
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue(
      { isLoaded: true } as UseDataSourceReturn,
    );
    const { container } = render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <SaveButton />
      </SWRConfig>,
    );

    await screen.findByText('Save');
    expect(container).toMatchSnapshot();
  });

  it('renders as expected when datasource ready and saving', async () => {
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue(
      { isLoaded: true } as UseDataSourceReturn,
    );
    const { container } = render(<SaveButton />);

    act(() => {
      mutate('/state/save', true, { revalidate: false });
    });

    expect(screen.getByRole('button')).toBeDisabled();
    expect(container).toMatchSnapshot();
  });

  it('calls datasource save on click', async () => {
    const mockSave = jest.fn();
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue(
      {
        isLoaded: true,
        save: mockSave as Function,
      } as UseDataSourceReturn,
    );
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <SaveButton />
      </SWRConfig>,
    );

    const button = screen.getByText('Save');

    fireEvent.click(button);

    await waitFor(() => expect(mockSave).toBeCalledTimes(1));
  });
});
