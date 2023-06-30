import { API } from 'aws-amplify';
import { DateTime } from 'luxon';

import Stocker from '../../apis/Stocker';

describe('Stocker', () => {
  let instance: Stocker;

  beforeEach(() => {
    instance = new Stocker();
    jest.spyOn(API, 'get').mockResolvedValue({ a: 'a' });
  });

  describe('getLiveSummary', () => {
    it('calls API with expected params', async () => {
      const result = await instance.getLiveSummary(['A', 'B']);

      expect(API.get).toHaveBeenCalledWith(
        'stocker',
        '/api/prices/live',
        { queryStringParameters: { ids: 'A,B' } },
      );
      expect(result).toEqual({ a: 'a' });
    });
  });

  describe('getPrice', () => {
    it('calls API with expected params', async () => {
      const result = await instance.getPrice('A', DateTime.fromISO('2023-01-01', { zone: 'utc' }));

      expect(API.get).toHaveBeenCalledWith(
        'stocker',
        '/api/price',
        { queryStringParameters: { id: 'A', when: 1672531200 } },
      );
      expect(result).toEqual({ a: 'a' });
    });
  });
});
