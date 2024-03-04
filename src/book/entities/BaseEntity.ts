import {
  BaseEntity as BE,
  BeforeInsert,
  BeforeUpdate,
  PrimaryColumn,
} from 'typeorm';
import * as v from 'class-validator';
import { QueryClient } from '@tanstack/react-query';

/**
 * Override BaseEntity so all entities have a generated guid in the format
 * we want and adds validation before saving or updating entities
 */
export default class BaseEntity extends BE {
  static CACHE_KEY: string[] = [];

  @BeforeInsert()
  @BeforeUpdate()
  async validate() {
    const errors = await v.validate(this, { stopAtFirstError: true });
    if (errors.length) {
      throw new Error(`validation failed: ${errors}`);
    }
  }

  @PrimaryColumn({
    type: 'varchar',
    length: 32,
  })
  @v.IsString()
    guid: string = crypto.randomUUID().substring(0, 31);

  get queryClient(): QueryClient | undefined {
    // @ts-ignore
    return this.constructor.dataSource.options.extra?.queryClient;
  }
}
