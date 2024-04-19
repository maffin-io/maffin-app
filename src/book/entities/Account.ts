import {
  IsNotEmpty,
  Matches,
  Length,
  IsIn,
  ValidateIf,
  IsOptional,
  registerDecorator,
} from 'class-validator';
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
import type { ValidationArguments, ValidationOptions } from 'class-validator';

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
  @Matches(/[a-zA-Z.]+/)
  @Length(1, 2048)
    name!: string;

  @Column({
    type: 'text',
    enum: Account.TYPES,
    length: 2048,
    name: 'account_type',
  })
  @CheckAccountType()
  @IsIn(Account.TYPES)
    type!: string;

  path!: string;

  @TreeParent()
  @JoinColumn({ name: 'parent_guid' })
  @IsNotEmpty({ message: 'parent is required' })
  @ValidateIf(o => o.type !== 'ROOT')
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
  @ValidateIf(o => o.type !== 'ROOT')
  @IsNotEmpty({ message: 'commodity is required' })
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
  @IsOptional()
  @Length(4, 2048)
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
    const account = await super.remove(options);

    if (this.queryClient) {
      updateCache({ queryClient: this.queryClient });
    }

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
function CheckAccountType(validationOptions?: ValidationOptions) {
  return function f(object: Account, propertyName: string) {
    registerDecorator({
      name: 'checkAccountType',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(type: string, args: ValidationArguments) {
          const account = args.object as Account;
          if (account.parent) {
            return getAllowedSubAccounts(account.parent.type).includes(type);
          }

          return true;
        },

        defaultMessage(args: ValidationArguments) {
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
function CheckIECommodity(validationOptions?: ValidationOptions) {
  return function f(object: Account, propertyName: string) {
    registerDecorator({
      name: 'checkIECommodity',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(fk_commodity: Commodity, args: ValidationArguments) {
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

        defaultMessage(args: ValidationArguments) {
          const account = args.object as Account;
          return `Income and Expense accounts must have ${(account.parent.fk_commodity as Commodity).mnemonic} as their commodity`;
        },
      },
    });
  };
}

/**
 * Checks if an account can be a placeholder. Accounts can be Placeholders
 * if:
 *
 *  - they don't have any transactions associated.
 *  - if an account has children, they must be a placeholder
 *  - accounts that are investments and have a placeholder investment as parent can't
 *    be placeholders
 */
function CheckPlaceholder(validationOptions?: ValidationOptions) {
  return function f(object: Account, propertyName: string) {
    registerDecorator({
      name: 'checkPlaceholder',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        async validate(_: string, args: ValidationArguments) {
          const account = args.object as Account;
          if (account.guid) {
            const [, numSplits] = await Split.findAndCount({
              where: { fk_account: { guid: account.guid } },
            });

            if (numSplits > 0 && account.placeholder) {
              return false;
            }
          }

          if (account.childrenIds?.length > 0 && !account.placeholder) {
            return false;
          }

          return true;
        },

        defaultMessage(args: ValidationArguments) {
          const account = args.object as Account;
          if (account.childrenIds?.length > 0 && !account.placeholder) {
            return 'Accounts with children must be parents';
          }

          return 'Placeholder accounts cannot have transactions';
        },
      },
    });
  };
}
