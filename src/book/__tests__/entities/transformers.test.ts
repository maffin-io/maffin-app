import { DateTime } from 'luxon';

import { DateTimeTransformer } from '../../entities/transformers';

describe('transformers', () => {
  describe('DateTimeTransformer', () => {
    let instance: DateTimeTransformer;

    beforeEach(() => {
      instance = new DateTimeTransformer();
    });

    it('deserializes date as expected', () => {
      expect(instance.from('2023-03-28 04:00:00')!.toISODate()).toEqual('2023-03-28');
    });

    it('returns null if receives null', () => {
      expect(instance.from(null)).toBeNull();
    });

    it('throws an error if invalid when deserializing', () => {
      expect(() => instance.from('asd')).toThrow('invalid date:');
    });

    it('serializes date as expected', () => {
      expect(instance.to(DateTime.fromISO('2023-03-28'))).toEqual('2023-03-28');
    });

    it('throws an error if invalid when serializing', () => {
      expect(() => instance.to(DateTime.fromISO('asd'))).toThrow('invalid date:');
    });
  });
});
