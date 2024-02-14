import { DateTime } from 'luxon';
import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  Index,
  SaveOptions,
} from 'typeorm';
import type { QueryClient } from '@tanstack/react-query';

import type Commodity from './Commodity';
import { DateTimeTransformer } from './transformers';
import BaseEntity from './BaseEntity';
import type { QuoteInfo } from '../types';
import { toAmountWithScale } from '../../helpers/number';

/**
 * https://wiki.gnucash.org/wiki/SQL#Tables
 *
 * CREATE TABLE prices (
 *   guid                CHAR(32) PRIMARY KEY NOT NULL,
 *   commodity_guid      CHAR(32) NOT NULL,
 *   currency_guid       CHAR(32) NOT NULL,
 *   date                timestamp NOT NULL,
 *   source              text(2048),
 *   type                text(2048),
 *   value_num           integer NOT NULL,
 *   value_denom         integer NOT NULL
 * );
*/
@Entity('prices')
@Index(['fk_commodity', 'fk_currency', 'date'], { unique: true })
export default class Price extends BaseEntity {
  static CACHE_KEY = '/api/prices';

  @ManyToOne('Commodity', { eager: true })
  @JoinColumn({ name: 'commodity_guid' })
    fk_commodity!: Commodity | string;

  get commodity(): Commodity {
    return this.fk_commodity as Commodity;
  }

  @ManyToOne('Commodity', { eager: true })
  @JoinColumn({ name: 'currency_guid' })
    fk_currency!: Commodity | string;

  get currency(): Commodity {
    return this.fk_currency as Commodity;
  }

  @Column({
    type: 'date',
    transformer: new DateTimeTransformer(),
  })
    date!: DateTime;

  @Column({
    type: 'integer',
    name: 'value_num',
  })
    valueNum!: number;

  @Column({
    type: 'integer',
    name: 'value_denom',
  })
    valueDenom!: number;

  // Used to store price data from stocker
  // if the price entry is created by maffin
  @Column({
    type: 'text',
    name: 'source',
    nullable: true,
  })
    source?: string;

  get quoteInfo(): QuoteInfo | null {
    if (this.source && this.source.startsWith('maffin::')) {
      return JSON.parse(this.source.split('::')[1]);
    }

    return null;
  }

  get value(): number {
    return this.valueNum / this.valueDenom;
  }

  set value(n: number) {
    const { amount, scale } = toAmountWithScale(n);
    this.valueNum = amount;
    this.valueDenom = parseInt('1'.padEnd(scale + 1, '0'), 10);
  }

  get id(): string {
    return `${this.date.toISODate()}.${this.commodity.mnemonic}.${this.currency.mnemonic}`;
  }

  async save(): Promise<this> {
    await Price.upsert(
      [this],
      {
        conflictPaths: ['fk_commodity', 'fk_currency', 'date'],
      },
    );

    if (this.queryClient) {
      updateCache({ queryClient: this.queryClient, entity: this });
    }

    return this;
  }

  async remove(options?: SaveOptions): Promise<this> {
    if (this.queryClient) {
      updateCache({ queryClient: this.queryClient, entity: this, isDelete: true });
    }

    const price = await super.remove(options);
    return price;
  }
}

/**
 * Invalidate /api/prices/<commodity> key so prices are refreshed
 * whenever there is a change for that given commodity.
 *
 * If fk_commodity is a CURRENCY, we also refresh /api/prices/<currency>
 * so when visiting the other currency we see updated (reversed) prices too.
 *
 * Note that if we want to optimise this with pre-computing, we need to take
 * into account that we are doing upserts so it's not enough to check existence
 * via guid, we also need to check for collisions with the same commodity-currency-date
 */
export async function updateCache(
  {
    queryClient,
    entity,
  }: {
    queryClient: QueryClient,
    entity: Price,
    isDelete?: boolean,
  },
) {
  queryClient.invalidateQueries({
    queryKey: [Price.CACHE_KEY, { commodity: (entity.fk_commodity as Commodity).guid }],
    refetchType: 'all',
  });

  if ((entity.fk_commodity as Commodity).namespace === 'CURRENCY') {
    queryClient.invalidateQueries({
      queryKey: [Price.CACHE_KEY, { commodity: (entity.fk_currency as Commodity).guid }],
      refetchType: 'all',
    });
  }
}

// https://github.com/typeorm/typeorm/issues/4714
Object.defineProperty(Price, 'name', { value: 'Price' });
