import {
  IsString,
  Length,
  Matches,
  IsOptional,
  registerDecorator,
} from 'class-validator';
import {
  Column,
  Entity,
  Index,
  SaveOptions,
} from 'typeorm';
import type { QueryClient } from '@tanstack/react-query';
import type { ValidationArguments, ValidationOptions } from 'class-validator';

import BaseEntity from './BaseEntity';

/**
 * https://wiki.gnucash.org/wiki/SQL#Tables
 *
 * CREATE TABLE commodities (
 *   guid            CHAR(32) PRIMARY KEY NOT NULL,
 *   namespace       text(2048) NOT NULL,
 *   mnemonic        text(2048) NOT NULL,
 *   fullname        text(2048),
 *   cusip           text(2048),
 *   fraction        integer NOT NULL,
 *   quote_flag      integer NOT NULL,
 *   quote_source    text(2048),
 *   quote_tz        text(2048)
 * );
 */

@Entity('commodities')
@Index(['mnemonic', 'namespace'], { unique: true })
export default class Commodity extends BaseEntity {
  static CACHE_KEY = ['api', 'commodities'];

  @Column({
    type: 'text',
    length: 2048,
  })
  @IsString()
  @Length(2, 2048)
    namespace!: string;

  @Column({
    type: 'text',
    length: 2048,
  })
  @CheckCurrencyCode()
  @Matches(/[a-zA-Z0-9]+/)
  @Length(2, 2048)
    mnemonic!: string;

  @Column({
    type: 'text',
    length: 2048,
    default: '',
  })
  @IsString()
  @IsOptional()
    fullname?: string;

  // We use this field as a way to identify the quote
  // in the exchange wherever we want to pull the price from
  // i.e. can be an ISIN, NVDA, etc. If this is not set, we fallback
  // to mnemonic
  @Column({
    type: 'text',
    length: 2048,
    nullable: true,
    name: 'cusip',
  })
  @IsOptional()
  @IsString()
    cusip?: string;

  get exchangeId(): string {
    return this.cusip || this.mnemonic;
  }

  async save(options?: SaveOptions): Promise<this> {
    const commodity = await super.save(options);

    if (this.queryClient) {
      updateCache({ queryClient: this.queryClient });
    }

    return commodity;
  }

  async remove(options?: SaveOptions): Promise<this> {
    const commodity = await super.remove(options);

    if (this.queryClient) {
      updateCache({ queryClient: this.queryClient });
    }

    return commodity;
  }
}

export async function updateCache({ queryClient }: { queryClient: QueryClient }) {
  queryClient.invalidateQueries({
    queryKey: [...Commodity.CACHE_KEY],
  });
}

// https://github.com/typeorm/typeorm/issues/4714
Object.defineProperty(Commodity, 'name', { value: 'Commodity' });

/**
 * If CURRENCY is selected as namespace, it checks that the code is 3 chars long
 */
function CheckCurrencyCode(validationOptions?: ValidationOptions) {
  return function f(object: Commodity, propertyName: string) {
    registerDecorator({
      name: 'checkCurrencyCode',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(mnemonic: string, args: ValidationArguments) {
          const account = args.object as Commodity;
          if (account.namespace === 'CURRENCY') {
            return mnemonic.length === 3;
          }

          return true;
        },

        defaultMessage() {
          return 'Currencies must have 3 characters';
        },
      },
    });
  };
}
