import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { SWRConfig, SWRResponse } from 'swr';
import * as swrImmutable from 'swr/immutable';

import useUser from '@/hooks/useUser';
import * as gapiHooks from '@/hooks/useGapiClient';

jest.mock('swr/immutable', () => ({
  __esModule: true,
  ...jest.requireActual('swr/immutable'),
}));

jest.mock('@/hooks/useGapiClient', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useGapiClient'),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const useRouter = jest.spyOn(require('next/navigation'), 'useRouter');

describe('useUser', () => {
  let mockRouterPush: jest.Mock;
  let mockPeopleGet: jest.Mock;

  beforeEach(() => {
    mockPeopleGet = jest.fn();
    window.gapi = {
      client: {
        people: {
          // @ts-ignore
          people: {
            get: mockPeopleGet,
          } as typeof gapi.client.people.people,
        } as typeof gapi.client.people,
      } as typeof gapi.client,
    } as typeof window.gapi;

    jest.spyOn(gapiHooks, 'default').mockReturnValue([false]);

    mockRouterPush = jest.fn();
    useRouter.mockImplementation(() => ({
      push: mockRouterPush,
    }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns empty user if gapi not loaded and doesnt redirect', async () => {
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <TestComponent />
      </SWRConfig>,
    );

    expect(mockRouterPush).not.toHaveBeenCalled();
    expect(JSON.parse((await screen.findByTestId('user')).innerHTML)).toEqual({
      name: '',
      email: '',
      image: '',
      isLoggedIn: false,
    });
  });

  it('returns empty user, redirects and sets empty token if not logged in', async () => {
    const mockStorageSetItem = jest.spyOn(Storage.prototype, 'setItem');
    jest.spyOn(gapiHooks, 'default').mockReturnValue([true]);
    const error = new Error('whatever');
    mockPeopleGet.mockRejectedValue({
      ...error,
      status: 401,
    });

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <TestComponent />
      </SWRConfig>,
    );

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalled();
    });
    expect(mockStorageSetItem).toHaveBeenCalledWith('accessToken', '');
    expect(JSON.parse((await screen.findByTestId('user')).innerHTML)).toEqual({
      name: '',
      email: '',
      image: '',
      isLoggedIn: false,
    });
  });

  it('returns empty user if still loading and doesnt redirect', async () => {
    jest.spyOn(gapiHooks, 'default').mockReturnValue([true]);
    mockPeopleGet.mockResolvedValue({
      result: {
        names: [{ displayName: 'name' }],
        emailAddresses: [{ value: 'email' }],
        photos: [{ url: 'image' }],
      },
    });
    jest.spyOn(swrImmutable, 'default').mockReturnValue({
      data: {
        name: '',
        email: '',
        image: '',
        isLoggedIn: false,
      },
      mutate: () => {},
      isLoading: true,
    } as SWRResponse);
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <TestComponent />
      </SWRConfig>,
    );

    expect(mockRouterPush).not.toHaveBeenCalled();
    expect(JSON.parse((await screen.findByTestId('user')).innerHTML)).toEqual({
      name: '',
      email: '',
      image: '',
      isLoggedIn: false,
    });
  });

  it('returns user as expected', async () => {
    jest.spyOn(gapiHooks, 'default').mockReturnValue([true]);
    mockPeopleGet.mockResolvedValue({
      result: {
        names: [{ displayName: 'name' }],
        emailAddresses: [{ value: 'email' }],
        photos: [{ url: 'image' }],
      },
    });

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <TestComponent />
      </SWRConfig>,
    );

    await waitFor(async () => {
      expect(JSON.parse((await screen.findByTestId('user')).innerHTML)).toEqual({
        name: 'name',
        email: 'email',
        image: 'image',
        isLoggedIn: true,
      });
    });
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});

function TestComponent(): JSX.Element {
  const { user } = useUser();

  return (
    <span data-testid="user">
      {JSON.stringify(user)}
    </span>
  );
}
