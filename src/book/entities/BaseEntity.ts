import {
  BaseEntity as BE,
  BeforeInsert,
  BeforeUpdate,
  PrimaryColumn,
  SaveOptions,
} from 'typeorm';
import * as v from 'class-validator';
import { QueryClient } from '@tanstack/react-query';

/**
 * Override BaseEntity so all entities have a generated guid in the format
 * we want and adds validation before saving or updating entities
 */
export default class BaseEntity extends BE {
  static CACHE_KEY = '';

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

  async save(options?: SaveOptions): Promise<this> {
    const entity = await super.save(options);

    if (this.queryClient && ['Account', 'Commodity'].includes(this.constructor.name)) {
      updateCache({ queryClient: this.queryClient, entity });
    }

    return entity;
  }

  async remove(options?: SaveOptions): Promise<this> {
    const entity = await super.remove(options);

    if (this.queryClient && ['Account', 'Commodity'].includes(this.constructor.name)) {
      updateCache({ queryClient: this.queryClient, entity, isDelete: true });
    }

    return entity;
  }

  get queryClient(): QueryClient | undefined {
    // @ts-ignore
    return this.constructor.dataSource.options.extra?.queryClient;
  }
}

/**
 * Updates `/api/<entity_name>` and
 * `/api/<entity_name>/<guid>` keys so changes are propagated
 * in the cache.
 *
 * - /api/<entity_name> is updated as a list of Entity[]
 * - /api/<entity_name>/<guid> is updated with the value of the Entity
 */
export async function updateCache(
  {
    queryClient,
    entity,
    isDelete = false,
  }: {
    queryClient: QueryClient,
    entity: BaseEntity,
    isDelete?: boolean,
  },
) {
  // @ts-ignore
  const key = entity.constructor.CACHE_KEY;

  queryClient.setQueryData(
    [key],
    (entities: BaseEntity[] | undefined) => {
      if (!entities) {
        return undefined;
      }

      const newEntities = [...entities];

      const index = entities.findIndex(e => e.guid === entity.guid);
      if (index === -1) { // New entity added
        newEntities.push(entity);
      } else if (!isDelete) { // Entity updated
        newEntities[index] = entity;
      } else if (isDelete) { // Entity deleted
        newEntities.splice(index, 1);
      }

      return newEntities;
    },
  );

  queryClient.setQueryData(
    [key, { guid: entity.guid }],
    !isDelete ? entity : null,
  );
}
