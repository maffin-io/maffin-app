import { DateTime } from 'luxon';
import {
  BaseEntity,
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany,
  PrimaryColumn,
} from 'typeorm';
import * as v from 'class-validator';

import type Commodity from './Commodity';
import type Split from './Split';
import { DateTimeTransformer } from './transformers';

/**
 * https://wiki.gnucash.org/wiki/SQL#Tables
 *
 * CREATE TABLE transactions (
 *   guid            CHAR(32) PRIMARY KEY NOT NULL,
 *   currency_guid   CHAR(32) NOT NULL,
 *   num             text(2048) NOT NULL,
 *   post_date       timestamp NOT NULL,
 *   enter_date      timestamp NOT NULL,
 *   description     text(2048)
 * );
 */

@Entity('transactions')
export default class Transaction extends BaseEntity {
  @PrimaryColumn({
    type: 'varchar',
    length: 32,
  })
    guid!: string;

  @ManyToOne('Commodity', { eager: true })
  @JoinColumn({ name: 'currency_guid' })
    fk_currency!: Commodity | string;

  get currency(): Commodity {
    return this.fk_currency as Commodity;
  }

  @Column({
    type: 'date',
    transformer: new DateTimeTransformer(),
    name: 'post_date',
  })
    date!: DateTime;

  @CreateDateColumn({
    name: 'enter_date',
  })
    enterDate?: Date;

  @OneToMany('Split', (split: Split) => split.fk_transaction)
    splits!: Split[];

  @Column({
    type: 'text',
    length: 2048,
    default: '',
  })
  @v.MaxLength(2048)
    description!: string;
}

// https://github.com/typeorm/typeorm/issues/4714
Object.defineProperty(Transaction, 'name', { value: 'Transaction' });
