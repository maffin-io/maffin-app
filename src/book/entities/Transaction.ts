import { DateTime } from 'luxon';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  SaveOptions,
} from 'typeorm';
import * as v from 'class-validator';
import { Type } from 'class-transformer';
import type { QueryClient } from '@tanstack/react-query';

import { toFixed } from '@/helpers/number';
import { isInvestment } from '../helpers/accountType';
import type Commodity from './Commodity';
import Split from './Split';
import BaseEntity from './BaseEntity';
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
  static CACHE_KEY = ['api', 'txs'];

  @ManyToOne('Commodity', { eager: true })
  @JoinColumn({ name: 'currency_guid' })
  @v.IsNotEmpty({ message: 'date is required' })
    fk_currency!: Commodity | string;

  get currency(): Commodity {
    return this.fk_currency as Commodity;
  }

  @Column({
    type: 'date',
    transformer: new DateTimeTransformer(),
    name: 'post_date',
  })
  @v.IsNotEmpty({ message: 'date is required' })
    date!: DateTime;

  @CreateDateColumn({
    name: 'enter_date',
  })
    enterDate?: Date;

  @OneToMany(
    'Split',
    (split: Split) => split.fk_transaction,
    { cascade: true }, // splits are useful only in a tx context
  )
  @CheckSplitsBalance()
  @CheckDuplicateSplitAccounts()
  @CheckNumSplits()
  @v.ValidateNested()
  @Type(() => Split)
    splits!: Split[];

  @Column({
    type: 'text',
    length: 2048,
    default: '',
  })
  @v.Length(1, 2048)
    description!: string;

  async save(options?: SaveOptions): Promise<this> {
    const account = await super.save(options);

    if (this.queryClient) {
      updateCache({ queryClient: this.queryClient, entity: this });
    }

    return account;
  }

  async remove(options?: SaveOptions): Promise<this> {
    if (this.queryClient) {
      updateCache({ queryClient: this.queryClient, entity: this, isDelete: true });
    }

    const account = await super.remove(options);
    return account;
  }
}

/**
 * Update some detail keys for consistency
 */
export async function updateCache(
  {
    entity,
    queryClient,
  }: {
    queryClient: QueryClient,
    entity: Transaction,
    isDelete?: boolean,
  },
) {
  queryClient.invalidateQueries({
    queryKey: [...Transaction.CACHE_KEY, entity.guid],
  });
  queryClient.invalidateQueries({
    queryKey: [...Transaction.CACHE_KEY, { name: 'latest' }],
  });
  queryClient.invalidateQueries({
    queryKey: [...Transaction.CACHE_KEY, { name: 'start' }],
  });

  queryClient.invalidateQueries({
    queryKey: [...Split.CACHE_KEY],
  });
}

// https://github.com/typeorm/typeorm/issues/4714
Object.defineProperty(Transaction, 'name', { value: 'Transaction' });

/**
 * Checks that the balance for the splits equals to 0
 */
function CheckSplitsBalance(validationOptions?: v.ValidationOptions) {
  return function f(object: Transaction, propertyName: string) {
    v.registerDecorator({
      name: 'splitsBalance',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(splits: Split[]) {
          if (splits.length >= 2) {
            const total = splits.reduce(
              (acc, split) => acc + (split.value || 0),
              0,
            );

            // Correct for floating point errors
            return toFixed(total, 4) === 0;
          }

          return true;
        },

        defaultMessage(args: v.ValidationArguments) {
          const tx = args.object as Transaction;
          const total = tx.splits.reduce(
            (acc, split) => acc + (split.value || 0),
            0,
          );
          return `Your transaction has an imbalance of ${toFixed(total, 4)}. Make sure the amounts you've specified in your records equal to the total amount of your transaction!`;
        },
      },
    });
  };
}

/**
 * Checks that there are no splits with repeated account
 */
function CheckDuplicateSplitAccounts(validationOptions?: v.ValidationOptions) {
  return function f(object: Transaction, propertyName: string) {
    v.registerDecorator({
      name: 'splitsDuplicateAccounts',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(splits: Split[]) {
          if (splits) {
            const set = new Set(splits.map(split => split.account?.guid));
            return set.size === splits.length;
          }

          return true;
        },

        defaultMessage() {
          return 'splits must have different accounts';
        },
      },
    });
  };
}

/**
 * Checks that the number of splits is the right one
 *
 * Conditions are the following:
 *
 * - In general it must have 2 or more splits
 * - If there's one split only and the account is an investment, it can
 *   be a split event.
 */
function CheckNumSplits(validationOptions?: v.ValidationOptions) {
  return function f(object: Transaction, propertyName: string) {
    v.registerDecorator({
      name: 'splitsNum',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(splits: Split[]) {
          if (splits && splits.length >= 2) {
            return true;
          }

          if (
            splits
            && splits.length === 1
            && isInvestment(splits[0].account)
          ) {
            return true;
          }

          return false;
        },

        defaultMessage(args: v.ValidationArguments) {
          const tx = args.object as Transaction;
          let minSplits = 2;

          if (tx.splits && isInvestment(tx.splits[0].account)) {
            minSplits = 1;
          }

          return `must add at least ${minSplits} splits`;
        },
      },
    });
  };
}
