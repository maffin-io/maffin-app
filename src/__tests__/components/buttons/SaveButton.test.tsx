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
import { DataSourceContext } from '@/hooks';
import type { DataSourceContextType } from '@/hooks';
import * as helpers_env from '@/helpers/env';

jest.mock('@/helpers/env', () => ({
  __esModule: true,
  isStaging: () => false,
}));

describe('SaveButton', () => {
  it('loads while unavailable datasource', async () => {
    const { container } = render(
      <DataSourceContext.Provider value={{ isLoaded: false } as DataSourceContextType}>
        <SWRConfig value={{ provider: () => new Map() }}>
          <SaveButton />
        </SWRConfig>
      </DataSourceContext.Provider>,
    );

    await screen.findByText('...');
    expect(container).toMatchSnapshot();
  });

  it('renders as expected when datasource ready and not saving', async () => {
    const { container } = render(
      <DataSourceContext.Provider value={{ isLoaded: true } as DataSourceContextType}>
        <SWRConfig value={{ provider: () => new Map() }}>
          <SaveButton />
        </SWRConfig>
      </DataSourceContext.Provider>,
    );

    await screen.findByText('Save');
    expect(container).toMatchSnapshot();
  });

  it('renders as expected when datasource ready and saving', async () => {
    const { container } = render(
      <DataSourceContext.Provider value={{ isLoaded: true } as DataSourceContextType}>
        <SaveButton />
      </DataSourceContext.Provider>,
    );

    act(() => {
      mutate('/state/save', true, { revalidate: false });
    });

    expect(screen.getByRole('button')).toBeDisabled();
    expect(container).toMatchSnapshot();
  });

  it('calls datasource save on click', async () => {
    const mockSave = jest.fn();
    render(
      <DataSourceContext.Provider
        value={{
          isLoaded: true,
          save: mockSave as Function,
        } as DataSourceContextType}
      >
        <SWRConfig value={{ provider: () => new Map() }}>
          <SaveButton />
        </SWRConfig>
      </DataSourceContext.Provider>,
    );

    const button = screen.getByText('Save');

    fireEvent.click(button);

    await waitFor(() => expect(mockSave).toBeCalledTimes(1));
  });

  it('is disabled when staging', async () => {
    jest.spyOn(helpers_env, 'isStaging').mockReturnValue(true);
    render(
      <DataSourceContext.Provider value={{ isLoaded: true } as DataSourceContextType}>
        <SaveButton />
      </DataSourceContext.Provider>,
    );

    expect(screen.getByRole('button')).toBeDisabled();
    process.env.NEXT_PUBLIC_ENV = '';
  });
});
