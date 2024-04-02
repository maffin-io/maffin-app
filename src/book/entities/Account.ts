import * as v from 'class-validator';
import {
  Column,
  Entity, JoinColumn,
  ManyToOne,
  OneToMany,
  RelationId,
  Tree,
  TreeParent,
  TreeChildren,
  SaveOptions,
} from 'typeorm';
import type { QueryClient } from '@tanstack/react-query';

import {
  getAllowedSubAccounts,
  ASSET_ACCOUNTS,
  LIABILITY_ACCOUNTS,
} from '@/book/helpers/accountType';
import type Commodity from './Commodity';
import Split from './Split';
import BaseEntity from './BaseEntity';

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
  static CACHE_KEY = ['api', 'accounts'];
  static TYPES = [
    'ROOT',
    'EQUITY',
    'INCOME',
    'EXPENSE',
    ...ASSET_ACCOUNTS,
    ...LIABILITY_ACCOUNTS,
  ];

  @Column({
    type: 'text',
    length: 2048,
  })
  @v.Matches(/[a-zA-Z.]+/)
  @v.Length(1, 2048)
    name!: string;

  @Column({
    type: 'text',
    enum: Account.TYPES,
    length: 2048,
    name: 'account_type',
  })
  @CheckAccountType()
  @v.IsIn(Account.TYPES)
    type!: string;

  path!: string;

  @TreeParent()
  @JoinColumn({ name: 'parent_guid' })
  @v.IsNotEmpty({ message: 'parent is required' })
  @v.ValidateIf(o => o.type !== 'ROOT')
  // Seems TreeParent doesn't let us create referencing the guid of the account
  // and needs the whole object...
    parent!: Account;

  @RelationId((account: Account) => account.parent)
    parentId: string;

  @TreeChildren()
    children!: Account[];

  @RelationId((account: Account) => account.children)
    childrenIds: string[];

  @ManyToOne('Commodity', { eager: true, cascade: true })
  @JoinColumn({ name: 'commodity_guid' })
  @CheckIECommodity()
  @v.ValidateIf(o => o.type !== 'ROOT')
  @v.IsNotEmpty({ message: 'commodity is required' })
    fk_commodity!: Commodity | string;

  get commodity(): Commodity {
    return this.fk_commodity as Commodity;
  }

  @OneToMany('Split', (split: Split) => split.fk_account)
    splits!: Split[];

  @Column({
    type: 'text',
    length: 2048,
    nullable: true,
  })
  @v.IsOptional()
  @v.Length(4, 2048)
    description?: string;

  @Column({
    default: false,
  })
    hidden!: boolean;

  @CheckPlaceholder()
  @Column({
    default: false,
  })
    // Placeholders are hierarchical accounts that don't containg
    // transactions, they are just parents of other accounts
    placeholder!: boolean;

  async save(options?: SaveOptions): Promise<this> {
    const account = await super.save(options);

    if (this.queryClient) {
      updateCache({ queryClient: this.queryClient });
    }

    return account;
  }

  async remove(options?: SaveOptions): Promise<this> {
    if (this.queryClient) {
      updateCache({ queryClient: this.queryClient });
    }

    const account = await super.remove(options);
    return account;
  }
}

export async function updateCache({ queryClient }: { queryClient: QueryClient }) {
  queryClient.invalidateQueries({
    queryKey: [...Account.CACHE_KEY],
  });
}

// https://github.com/typeorm/typeorm/issues/4714
Object.defineProperty(Account, 'name', { value: 'Account' });

/**
 * Checks allowed types for parent account given the current account's type
 */
function CheckAccountType(validationOptions?: v.ValidationOptions) {
  return function f(object: Account, propertyName: string) {
    v.registerDecorator({
      name: 'checkAccountType',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(type: string, args: v.ValidationArguments) {
          const account = args.object as Account;
          if (account.parent) {
            return getAllowedSubAccounts(account.parent.type).includes(type);
          }

          return true;
        },

        defaultMessage(args: v.ValidationArguments) {
          const account = args.object as Account;
          const allowedTypes = getAllowedSubAccounts(account.parent.type);

          return `only ${allowedTypes} types can be selected with ${account.parent.type} account as parent`;
        },
      },
    });
  };
}

/**
 * Checks that income/expense commodity is the same as the parent.
 *
 * This is a way to check that we always keep the same currency for income/expense
 * account as we only support them in the main currency.
 */
function CheckIECommodity(validationOptions?: v.ValidationOptions) {
  return function f(object: Account, propertyName: string) {
    v.registerDecorator({
      name: 'checkIECommodity',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(fk_commodity: Commodity, args: v.ValidationArguments) {
          const account = args.object as Account;
          if (
            account.parent
            && account.parent.type !== 'ROOT'
            && ['INCOME', 'EXPENSE'].includes(account.type)
          ) {
            return fk_commodity.guid === (account.parent.fk_commodity as Commodity).guid;
          }

          return true;
        },

        defaultMessage(args: v.ValidationArguments) {
          const account = args.object as Account;
          return `Income and Expense accounts must have ${(account.parent.fk_commodity as Commodity).mnemonic} as their commodity`;
        },
      },
    });
  };
}

/**
 * Checks if an account can be a placeholder. Accounts can be Placeholders
 * if they don't have any transactions associated.
 */
function CheckPlaceholder(validationOptions?: v.ValidationOptions) {
  return function f(object: Account, propertyName: string) {
    v.registerDecorator({
      name: 'checkPlaceholder',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        async validate(_: string, args: v.ValidationArguments) {
          const account = args.object as Account;
          if (account.guid) {
            const [, numSplits] = await Split.findAndCount({
              where: { fk_account: { guid: account.guid } },
            });

            if (numSplits > 0 && account.placeholder) {
              return false;
            }
          }

          return true;
        },

        defaultMessage() {
          return 'Placeholder accounts cannot have transactions';
        },
      },
    });
  };
}
