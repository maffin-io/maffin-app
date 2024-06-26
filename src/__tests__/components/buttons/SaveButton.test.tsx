import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import * as query from '@tanstack/react-query';

import SaveButton from '@/components/buttons/SaveButton';
import { DataSourceContext } from '@/hooks';
import type { DataSourceContextType } from '@/hooks';
import * as stateHooks from '@/hooks/state';
import * as sessionHook from '@/hooks/useSession';

jest.mock('@tanstack/react-query');
jest.mock('@/lib/prices');

jest.mock('@/hooks/useSession', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useSession'),
}));

jest.mock('@/hooks/state', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/state'),
}));

describe('SaveButton', () => {
  beforeEach(() => {
    jest.spyOn(query, 'useQuery').mockReturnValue({ data: false } as query.UseQueryResult<boolean>);
    jest.spyOn(stateHooks, 'useOnline').mockReturnValue({ isOnline: true });
    jest.spyOn(sessionHook, 'default').mockReturnValue({
      roles: { isPremium: true },
    } as sessionHook.SessionReturn);
  });

  it('loads while unavailable datasource', async () => {
    const { container } = render(
      <DataSourceContext.Provider value={{ isLoaded: false } as DataSourceContextType}>
        <SaveButton />
      </DataSourceContext.Provider>,
    );

    await screen.findByText('...');
    expect(container).toMatchSnapshot();
  });

  it('renders as expected when datasource ready and not saving', async () => {
    const { container } = render(
      <DataSourceContext.Provider value={{ isLoaded: true } as DataSourceContextType}>
        <SaveButton />
      </DataSourceContext.Provider>,
    );

    await screen.findByText('Save');
    expect(container).toMatchSnapshot();
  });

  it('renders as expected when offline', async () => {
    jest.spyOn(query, 'useQuery').mockReturnValue({ data: true } as query.UseQueryResult<boolean>);
    jest.spyOn(stateHooks, 'useOnline').mockReturnValue({ isOnline: false });

    const { container } = render(
      <DataSourceContext.Provider value={{ isLoaded: true } as DataSourceContextType}>
        <SaveButton />
      </DataSourceContext.Provider>,
    );

    expect(screen.getByRole('button')).toBeDisabled();
    expect(container).toMatchSnapshot();
  });

  it('renders as expected when datasource ready and saving', async () => {
    jest.spyOn(query, 'useQuery').mockReturnValue({ data: true } as query.UseQueryResult<boolean>);
    const { container } = render(
      <DataSourceContext.Provider value={{ isLoaded: true } as DataSourceContextType}>
        <SaveButton />
      </DataSourceContext.Provider>,
    );

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
        <SaveButton />
      </DataSourceContext.Provider>,
    );

    const button = screen.getByText('Save');

    fireEvent.click(button);

    await waitFor(() => expect(mockSave).toBeCalledTimes(1));
  });

  it('is disabled when not PAID_PLAN', async () => {
    jest.spyOn(sessionHook, 'default').mockReturnValue({
      roles: { isPremium: false },
    } as sessionHook.SessionReturn);
    render(
      <DataSourceContext.Provider value={{ isLoaded: true } as DataSourceContextType}>
        <SaveButton />
      </DataSourceContext.Provider>,
    );

    expect(screen.getByRole('button')).toBeDisabled();
  });
});
