import getUser from '@/lib/getUser';
import * as helpers_env from '@/helpers/env';

jest.mock('@/helpers/env', () => ({
  __esModule: true,
  isStaging: () => false,
}));

describe('getUser', () => {
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
  });

  it('returns empty user when error', async () => {
    const error = new Error('whatever');
    mockPeopleGet.mockRejectedValue({
      ...error,
      status: 401,
    });

    const user = await getUser();
    expect(user).toEqual({
      name: '',
      email: '',
      image: '',
      isLoggedIn: false,
    });
  });

  it('returns user from success response', async () => {
    mockPeopleGet.mockResolvedValue({
      result: {
        names: [{ displayName: 'name' }],
        emailAddresses: [{ value: 'email' }],
        photos: [{ url: 'image' }],
      },
    });

    const user = await getUser();
    expect(user).toEqual({
      name: 'name',
      email: 'email',
      image: 'image',
      isLoggedIn: true,
    });
  });

  it('returns fake user when env is staging', async () => {
    jest.spyOn(helpers_env, 'isStaging').mockReturnValue(true);
    const user = await getUser();
    expect(user).toEqual({
      name: 'Maffin',
      email: 'iomaffin@gmail.com',
      image: '',
      isLoggedIn: true,
    });
  });
});
