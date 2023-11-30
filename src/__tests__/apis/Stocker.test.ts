import { API } from 'aws-amplify';
import { DateTime } from 'luxon';

import * as stocker from '../../apis/Stocker';

describe('Stocker', () => {
  describe('getPrices', () => {
    beforeEach(() => {
      jest.spyOn(API, 'get').mockResolvedValue({ price: 1.23456, currency: 'USD' });
    });

    it('calls API with expected params', async () => {
      const result = await stocker.getPrices(['A', 'B']);

      expect(API.get).toHaveBeenCalledWith(
        'stocker',
        '/api/prices',
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
      const result = await stocker.getPrice('A', DateTime.fromISO('2023-01-01'));

      expect(API.get).toHaveBeenCalledWith(
        'stocker',
        '/api/price',
        { queryStringParameters: { id: 'A', when: 1672531200 } },
      );
      expect(result).toEqual({ price: 1.2346, currency: 'USD' });
    });
  });
});
