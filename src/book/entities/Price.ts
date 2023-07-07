import { DateTime } from 'luxon';
import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import type Commodity from './Commodity';
import { DateTimeTransformer } from './transformers';
import BaseEntity from './BaseEntity';
import type { QuoteInfo } from '../types';

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

  get id(): string {
    return `${this.date.toISODate()}.${this.commodity.mnemonic}.${this.currency.mnemonic}`;
  }
}

// https://github.com/typeorm/typeorm/issues/4714
Object.defineProperty(Price, 'name', { value: 'Price' });
