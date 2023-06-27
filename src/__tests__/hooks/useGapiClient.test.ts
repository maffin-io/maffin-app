import { act, renderHook } from '@testing-library/react';

import useGapiClient from '@/hooks/useGapiClient';

describe('useGapiClient', () => {
  beforeEach(() => {
    // @ts-ignore
    window.gapi = null;
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

  it('returns false when script onload not finished', () => {
    const { result } = renderHook(() => useGapiClient());

    expect(result.current).toEqual([false]);
  });

  /**
   * This test simulates the whole process of creating the gapi script element and then
   * calling the onload method to load the proper client libraries
   */
  it('returns true when script onload finished and loads needed libraries', async () => {
    const mockGapiLoad: jest.MockedFunction<typeof window.gapi.load> = jest.fn((api, callback) => {
      window.gapi.client = {
        setToken: mockGapiClientSetToken as typeof window.gapi.client.setToken,
        load: mockGapiClientLoad as typeof window.gapi.client.load,
      } as typeof gapi.client;
      callback();
    });
    const mockGapiClientLoad: jest.MockedFunction<typeof window.gapi.client.load> = jest.fn();
    // eslint-disable-nextline max-len
    const mockGapiClientSetToken: jest.MockedFunction<
      typeof window.gapi.client.setToken
    > = jest.fn();
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('accessToken');

    const { result } = renderHook(() => useGapiClient());
    expect(result.current).toEqual([false]);

    // eslint-disable-next-line testing-library/no-node-access
    const script = document.getElementById('maffin-gapi');
    expect(script).not.toBeNull();
    expect(script!.onload).not.toBeNull();
    window.gapi = {
      load: mockGapiLoad as typeof window.gapi.load,
    } as typeof gapi;

    await act(() => {
      // @ts-ignore
      script.onload();
    });

    expect(result.current).toEqual([true]);
    expect(mockGapiLoad).toHaveBeenCalledWith('client', expect.any(Function));
    expect(mockGapiClientSetToken).toHaveBeenCalledWith({ access_token: 'accessToken' });
    expect(mockGapiClientLoad).toHaveBeenCalledWith('https://www.googleapis.com/discovery/v1/apis/people/v1/rest');
    expect(mockGapiClientLoad).toHaveBeenCalledWith('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest');
  });
});
