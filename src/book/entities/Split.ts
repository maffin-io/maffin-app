import * as v from 'class-validator';
import {
  BaseEntity,
  Column,
  Relation,
  Entity, JoinColumn, ManyToOne, PrimaryColumn,
} from 'typeorm';

import type Account from './Account';
import type Transaction from './Transaction';

/**
 * https://wiki.gnucash.org/wiki/SQL#Tables
 *
 * CREATE TABLE splits (
 *   guid            CHAR(32) PRIMARY KEY NOT NULL,
 *   tx_guid         CHAR(32) NOT NULL,
 *   account_guid    CHAR(32) NOT NULL,
 *   memo            text(2048) NOT NULL,
 *   action          text(2048) NOT NULL,
 *   reconcile_state text(1) NOT NULL,
 *   reconcile_date  timestamp NOT NULL,
 *   value_num       integer NOT NULL,
 *   value_denom     integer NOT NULL,
 *   quantity_num    integer NOT NULL,
 *   quantity_denom  integer NOT NULL,
 *   lot_guid        CHAR(32)
 * );
*/
@Entity('splits')
export default class Split extends BaseEntity {
  @PrimaryColumn({
    type: 'varchar',
    length: 32,
  })
  @v.Length(1, 32)
    guid!: string;

  @ManyToOne('Transaction')
  @JoinColumn({ name: 'tx_guid' })
    fk_transaction!: Relation<Transaction> | string;

  get transaction(): Transaction {
    return this.fk_transaction as Transaction;
  }

  @ManyToOne('Account')
  @JoinColumn({ name: 'account_guid' })
    fk_account!: Relation<Account> | string;

  get account(): Account {
    return this.fk_account as Account;
  }

  // For stock operations, action is set to Buy
  @PrimaryColumn({
    type: 'varchar',
    length: 2048,
  })
    action?: string = '';

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

  @Column({
    type: 'integer',
    name: 'quantity_num',
  })
    quantityNum!: number;

  @Column({
    type: 'integer',
    name: 'quantity_denom',
  })
    quantityDenom!: number;

  /**
   * Returns the value of the transaction in the transaction's currency
   * Let's say you have the following split:
   *
   *  <split:value>100000/100</split:value>
   *  <split:quantity>1228501/10000</split:quantity>
   *
   * where the currency of the Transaction is EUR. This means you spent 1000 EUR to buy
   * 122.8501 of whatever the split's account currency is.
   *
   * When the two currencies are the same, both value and quantity are the same.
   *
   * @returns - value in transaction's currency
   */
  get value(): number {
    return this.valueNum / this.valueDenom;
  }

  /**
   * Returns the quantity spent in the currency of the split's account.
   * Let's say you have the following split:
   *
   *  <split:value>100000/100</split:value>
   *  <split:quantity>1228501/10000</split:quantity>
   *
   * where the currency of the Transaction is EUR and the symbol of the account
   * is GOOGL. This means that you spent 1000 EUR to purchase 122.8501 GOOGL
   * stocks.
   *
   * When the two currencies are the same, both value and quantity are the same.
   *
   * @returns - quantity spent in purchasing in the split account's currency
   */
  get quantity(): number {
    return this.quantityNum / this.quantityDenom;
  }
}

// https://github.com/typeorm/typeorm/issues/4714
Object.defineProperty(Split, 'name', { value: 'Split' });
