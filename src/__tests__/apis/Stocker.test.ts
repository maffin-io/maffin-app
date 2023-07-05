import { API } from 'aws-amplify';
import { DateTime } from 'luxon';

import Stocker from '../../apis/Stocker';

describe('Stocker', () => {
  let instance: Stocker;

  beforeEach(() => {
    instance = new Stocker();
  });

  describe('getLiveSummary', () => {
    beforeEach(() => {
      jest.spyOn(API, 'get').mockResolvedValue({ price: 1.23456, currency: 'USD' });
    });

    it('calls API with expected params', async () => {
      const result = await instance.getLiveSummary(['A', 'B']);

      expect(API.get).toHaveBeenCalledWith(
        'stocker',
        '/api/prices/live',
        { queryStringParameters: { ids: 'A,B' } },
      );
      expect(result).toEqual({ price: 1.23456, currency: 'USD' });
    });
  });

  describe('getPrice', () => {
    beforeEach(() => {
      jest.spyOn(API, 'get').mockResolvedValue({ price: 1.23456, currency: 'USD' });
    });

    it('calls API with expected params', async () => {
      const result = await instance.getPrice('A', DateTime.fromISO('2023-01-01', { zone: 'utc' }));

      expect(API.get).toHaveBeenCalledWith(
        'stocker',
        '/api/price',
        { queryStringParameters: { id: 'A', when: 1672531200 } },
      );
      expect(result).toEqual({ price: 1.2346, currency: 'USD' });
    });
  });
});
