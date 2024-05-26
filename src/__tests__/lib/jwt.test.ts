import jwt from 'jsonwebtoken';

import { isPremium, verify } from '@/lib/jwt';

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

describe('isPremium', () => {
  it('returns true when premium', async () => {
    jest.spyOn(jwt, 'decode').mockReturnValue({
      'https://maffin/roles': ['premium'],
    });

    expect(await isPremium('token')).toBe(true);
  });

  it('returns false when not premium', async () => {
    jest.spyOn(jwt, 'decode').mockReturnValue({
      'https://maffin/roles': [],
    });

    expect(await isPremium('token')).toBe(false);
  });
});
