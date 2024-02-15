import { waitFor } from '@testing-library/react';
import * as v from 'class-validator';
import { BaseEntity as BE } from 'typeorm';

import { BaseEntity } from '../../entities';

describe('BaseEntity', () => {
  let instance: BaseEntity;

  beforeEach(async () => {
    instance = new BaseEntity();
    jest.spyOn(v, 'validate');
  });

  it('inherits from typeorm base entity', () => {
    expect(instance).toBeInstanceOf(BE);
  });

  it('auto generates guid', () => {
    expect(instance.guid).toEqual(expect.any(String));
  });

  it('validates', async () => {
    await instance.validate();

    expect(v.validate).toHaveBeenCalledWith(
      { guid: expect.any(String) },
      { stopAtFirstError: true },
    );
  });

  it('throws error on validation fail', async () => {
    // @ts-ignore
    instance.guid = 1;
    await expect(instance.validate()).rejects.toThrow('isString');
  });

  describe('caching', () => {
    let mockSetQueryData: jest.Mock;
    class Account extends BaseEntity {
      static CACHE_KEY = ['api', 'accounts'];
    }

    beforeEach(() => {
      instance = new Account();
      jest.spyOn(BE.prototype, 'save').mockResolvedValue(instance);

      mockSetQueryData = jest.fn()
        .mockImplementation((_: string, callback: Account | Function): Account[] | Account => {
          if (callback instanceof Function) {
            return callback(undefined);
          }

          return instance;
        });

      // @ts-ignore
      instance.constructor.dataSource = {
        options: {
          extra: {
            queryClient: {
              setQueryData: mockSetQueryData,
            },
          },
        },
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('calls setQueryData with expected params', async () => {
      await instance.save();

      expect(BE.prototype.save).toBeCalledWith(undefined);
      expect(mockSetQueryData).toHaveBeenNthCalledWith(
        1,
        ['api', 'accounts'],
        expect.any(Function),
      );
      expect(mockSetQueryData).toHaveBeenNthCalledWith(
        2,
        ['api', 'accounts', { guid: instance.guid }],
        instance,
      );
    });

    it('returns undefined when no data in /api/accounts', async () => {
      await instance.save();
      await waitFor(() => expect(mockSetQueryData.mock.results[0].value).toBeUndefined());
    });

    it('adds account to existing /api/accounts', async () => {
      const instance2 = new Account();
      jest.spyOn(BE.prototype, 'save')
        .mockResolvedValueOnce(instance)
        .mockResolvedValueOnce(instance2);

      await instance.save();
      mockSetQueryData
        .mockImplementation((_: string, callback: Account | Function): Account[] | Account => {
          if (callback instanceof Function) {
            return callback([instance]);
          }

          return instance;
        });
      await instance2.save();

      await waitFor(() => expect(mockSetQueryData.mock.results).toHaveLength(4));
      expect(mockSetQueryData.mock.results[2].value).toEqual([instance, instance2]);
    });

    it('updates existing account in /api/accounts', async () => {
      jest.spyOn(BE.prototype, 'save')
        .mockResolvedValueOnce(instance);
      await instance.save();
      mockSetQueryData
        .mockImplementation((_: string, callback: Account | Function): Account[] | Account => {
          if (callback instanceof Function) {
            return callback([instance]);
          }

          return instance;
        });

      // @ts-ignore fake attribute to prove we update
      instance.name = 'updated';
      jest.spyOn(BE.prototype, 'save')
        .mockResolvedValueOnce(instance);
      await instance.save();

      await waitFor(() => expect(mockSetQueryData.mock.results).toHaveLength(4));
      expect(mockSetQueryData.mock.results[2].value).toEqual([
        {
          ...instance,
          name: 'updated',
        },
      ]);
    });

    it('deletes existing account in /api/accounts', async () => {
      jest.spyOn(BE.prototype, 'save')
        .mockResolvedValueOnce(instance);
      jest.spyOn(BE.prototype, 'remove')
        .mockResolvedValueOnce(instance);

      await instance.save();
      mockSetQueryData
        .mockImplementation((_: string, callback: Account | Function): Account[] | Account => {
          if (callback instanceof Function) {
            return callback([instance]);
          }

          return instance;
        });
      await instance.remove();

      await waitFor(() => expect(mockSetQueryData.mock.results).toHaveLength(4));
      expect(mockSetQueryData.mock.results[2].value).toEqual([]);

      expect(mockSetQueryData).toHaveBeenNthCalledWith(
        4,
        ['api', 'accounts', { guid: instance.guid }],
        null,
      );
    });
  });
});
