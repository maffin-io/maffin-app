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
});
