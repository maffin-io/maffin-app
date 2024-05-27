import jwt from 'jsonwebtoken';

import { verify, getRoles } from '@/lib/jwt';

describe('verify', () => {
  beforeEach(() => {
    jest.spyOn(jwt, 'verify').mockImplementation(
      (token, getKey, options, callback) => callback?.(null, 'decodedToken'),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns token on success', async () => {
    const token = await verify('token');
    expect(jwt.verify).toBeCalledWith('token', expect.any(Function), {}, expect.any(Function));
    expect(token).toEqual('decodedToken');
  });

  it('throws exception on verify fail', async () => {
    jest.spyOn(jwt, 'verify').mockImplementation(
      // @ts-ignore
      (token, getKey, options, callback) => callback?.(new Error('fail'), undefined),
    );

    await expect(verify('token')).rejects.toThrow('fail');
  });
});

describe('getRoles', () => {
  it('returns true', async () => {
    jest.spyOn(jwt, 'decode').mockReturnValue({
      'https://maffin/roles': ['premium', 'beta'],
    });

    expect(await getRoles('token')).toEqual({ isPremium: true, isBeta: true });
  });

  it('returns false', async () => {
    jest.spyOn(jwt, 'decode').mockReturnValue({
      'https://maffin/roles': [],
    });

    expect(await getRoles('token')).toEqual({ isPremium: false, isBeta: false });
  });
});
