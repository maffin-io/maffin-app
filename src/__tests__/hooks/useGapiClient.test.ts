import { act, renderHook } from '@testing-library/react';

import useGapiClient from '@/hooks/useGapiClient';
import * as sessionHook from '@/hooks/useSession';
import * as helpers_env from '@/helpers/env';
import type { Credentials } from '@/types/user';

jest.mock('@/hooks/useSession', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useSession'),
}));

jest.mock('@/helpers/env', () => ({
  __esModule: true,
  isStaging: () => false,
}));

describe('useGapiClient', () => {
  beforeEach(() => {
    // @ts-ignore
    window.gapi = null;

    jest.spyOn(helpers_env, 'isStaging').mockReturnValue(false);
    jest.spyOn(sessionHook, 'default').mockReturnValue({
      session: undefined,
      setCredentials: jest.fn() as Function,
    } as sessionHook.SessionReturn);
  });

  it('creates script element', () => {
    renderHook(() => useGapiClient());

    // eslint-disable-next-line testing-library/no-node-access
    const script = document.getElementById('maffin-gapi');

    if (script === null) {
      throw new Error('script maffin-gapi not created');
    }
    // eslint-disable-next-line testing-library/no-node-access
    expect(document.body.getElementsByTagName('script').length).toEqual(1);
    expect(script.outerHTML).toEqual('<script id="maffin-gapi" src="https://apis.google.com/js/api.js"></script>');
    expect(script.onload).toEqual(expect.any(Function));
  });

  /**
   * This is not desired behavior, ideally we should create only once and then wait for it to load
   * and if not retry but.. dunno how to do that yet
   */
  it('creates script element multiple times if not loaded yet', () => {
    renderHook(() => useGapiClient());
    renderHook(() => useGapiClient());

    // eslint-disable-next-line testing-library/no-node-access
    expect(document.body.getElementsByTagName('script').length).toEqual(2);
  });

  it('creates script element once when multiple calls once loaded', () => {
    renderHook(() => useGapiClient());
    window.gapi = {
      client: {} as typeof gapi.client,
    } as typeof gapi;
    renderHook(() => useGapiClient());

    // eslint-disable-next-line testing-library/no-node-access
    expect(document.body.getElementsByTagName('script').length).toEqual(1);
  });

  it('returns true when isStaging', () => {
    jest.spyOn(helpers_env, 'isStaging').mockReturnValue(true);
    const { result } = renderHook(() => useGapiClient());

    expect(result.current).toEqual([true]);
  });

  it('returns false when script onload not finished', () => {
    const { result } = renderHook(() => useGapiClient());

    expect(result.current).toEqual([false]);
  });

  it('returns false when session not available', async () => {
    const { result } = renderHook(() => useGapiClient());

    const mockGapiClientLoad: jest.MockedFunction<typeof window.gapi.client.load> = jest.fn();
    const mockGapiClientSetToken: jest.MockedFunction<
      typeof window.gapi.client.setToken
    > = jest.fn();
    // @ts-ignore
    const mockGapiLoad: jest.MockedFunction<typeof window.gapi.load> = jest.fn((api, callback) => {
      window.gapi.client = {
        setToken: mockGapiClientSetToken as typeof window.gapi.client.setToken,
        load: mockGapiClientLoad as typeof window.gapi.client.load,
      } as typeof gapi.client;
      callback();
    });

    // eslint-disable-next-line testing-library/no-node-access
    const script = document.getElementById('maffin-gapi');
    expect(script).not.toBeNull();
    expect(script?.onload).not.toBeNull();
    window.gapi = {
      load: mockGapiLoad as typeof window.gapi.load,
    } as typeof gapi;

    await act(async () => {
      if (script?.onload) {
        await script.onload({} as Event);
      }
    });

    expect(result.current).toEqual([false]);
  });

  /**
   * This test simulates the whole process of creating the gapi script element and then
   * calling the onload method to load the proper client libraries
   */
  it('returns true when script onload finished and session and loads needed libraries', async () => {
    jest.spyOn(sessionHook, 'default').mockReturnValue(
      {
        session: { access_token: 'access_token' } as Credentials,
        setCredentials: jest.fn() as Function,
      } as sessionHook.SessionReturn,
    );
    const mockGapiClientLoad: jest.MockedFunction<typeof window.gapi.client.load> = jest.fn();
    const mockGapiClientSetToken: jest.MockedFunction<
      typeof window.gapi.client.setToken
    > = jest.fn();

    // @ts-ignore
    const mockGapiLoad: jest.MockedFunction<typeof window.gapi.load> = jest.fn((api, callback) => {
      window.gapi.client = {
        setToken: mockGapiClientSetToken as typeof window.gapi.client.setToken,
        load: mockGapiClientLoad as typeof window.gapi.client.load,
      } as typeof gapi.client;
      callback();
    });

    const { result } = renderHook(() => useGapiClient());
    expect(result.current).toEqual([false]);

    // eslint-disable-next-line testing-library/no-node-access
    const script = document.getElementById('maffin-gapi');
    expect(script).not.toBeNull();
    expect(script?.onload).not.toBeNull();
    window.gapi = {
      load: mockGapiLoad as typeof window.gapi.load,
    } as typeof gapi;

    await act(async () => {
      if (script?.onload) {
        await script.onload({} as Event);
      }
    });

    expect(result.current).toEqual([true]);
    expect(mockGapiLoad).toHaveBeenCalledWith('client', expect.any(Function));
    expect(mockGapiClientSetToken).toHaveBeenCalledWith({ access_token: 'access_token' });
    expect(mockGapiClientLoad).toHaveBeenCalledWith(
      'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
    );
  });
});
