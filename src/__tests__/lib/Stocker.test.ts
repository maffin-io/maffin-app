import { API } from 'aws-amplify';

import { authorize, refresh } from '@/lib/Stocker';

jest.mock('aws-amplify');

describe('Stocker', () => {
  describe('authorize', () => {
    it('passes code token and returns credentials', async () => {
      jest.spyOn(API, 'get').mockResolvedValue({
        access_token: 'at',
      });

      const credentials = await authorize('code_token');

      expect(API.get).toBeCalledWith(
        'stocker',
        '/user/authorize',
        {
          queryStringParameters: { code: 'code_token' },
        },
      );
      expect(credentials).toEqual({ access_token: 'at' });
    });
  });

  describe('refresh', () => {
    it('passes refresh token and returns credentials', async () => {
      jest.spyOn(API, 'get').mockResolvedValue({
        access_token: 'at',
      });

      const credentials = await refresh('refresh_token');

      expect(API.get).toBeCalledWith(
        'stocker',
        '/user/refresh',
        {
          queryStringParameters: { refresh_token: 'refresh_token' },
        },
      );
      expect(credentials).toEqual({ access_token: 'at' });
    });
  });
});
