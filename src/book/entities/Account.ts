import * as v from 'class-validator';
import {
  BaseEntity,
  Column,
  Entity, JoinColumn,
  ManyToOne,
  Tree,
  TreeParent,
  TreeChildren,
  OneToMany, PrimaryColumn,
} from 'typeorm';

import type Commodity from './Commodity';
import Money from '../Money';
import type Split from './Split';

/**
 * CREATE TABLE accounts (
 *   guid            CHAR(32) PRIMARY KEY NOT NULL,
 *   name            text(2048) NOT NULL,
 *   account_type    text(2048) NOT NULL,
 *   commodity_guid  CHAR(32) NOT NULL,
 *   commodity_scu   integer NOT NULL,
 *   non_std_scu     integer NOT NULL,
 *   parent_guid     CHAR(32),
 *   code            text(2048),
 *   description     text(2048),
 *   hidden          integer NOT NULL,
 *   placeholder     integer NOT NULL
 * );
 */

@Entity('accounts')
@Tree('nested-set')
export default class Account extends BaseEntity {
  static TYPES = ['ROOT', 'ASSET', 'BANK', 'CASH', 'EQUITY', 'LIABILITY', 'INCOME', 'EXPENSE', 'MUTUAL', 'STOCK'];

  @PrimaryColumn({
    type: 'varchar',
    length: 32,
  })
  @v.Length(1, 32)
    guid!: string;

  @Column({
    type: 'text',
    length: 2048,
  })
  @v.MaxLength(2048)
    name!: string;

  @Column({
    type: 'text',
    enum: Account.TYPES,
    length: 2048,
    name: 'account_type',
  })
  @v.IsIn(Account.TYPES)
    type!: string;

  @Column({
    type: 'text',
    select: false,
    default: '',
  })
    path!: string;

  @TreeParent()
  @JoinColumn({ name: 'parent_guid' })
  // Seems TreeParent doesn't let us create referencing the guid of the account
  // and needs the whole object...
    parent!: Account;

  @TreeChildren()
    children!: Account[];

  @ManyToOne('Commodity', { eager: true })
  @JoinColumn({ name: 'commodity_guid' })
    fk_commodity!: Commodity | string;

  get commodity(): Commodity {
    return this.fk_commodity as Commodity;
  }

  @OneToMany('Split', (split: Split) => split.fk_account)
    splits!: Split[];

  /**
   * Note this only works if the entity has access to splits
   */
  get total(): Money {
    if (this.type === 'ROOT') {
      // @ts-ignore
      return null;
    }

    const total = this.splits.reduce(
      (acc, split) => acc.add(
        new Money(split.quantityNum / split.quantityDenom, this.commodity.mnemonic),
      ),
      new Money(0, this.commodity.mnemonic),
    );

    if (total.isNegative()) {
      return total.multiply(-1);
    }

    return total;
  }
}

// https://github.com/typeorm/typeorm/issues/4714
Object.defineProperty(Account, 'name', { value: 'Account' });
