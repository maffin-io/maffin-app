import * as v from 'class-validator';
import {
  Column,
  Entity,
} from 'typeorm';

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
export default class Commodity extends BaseEntity {
  @Column({
    type: 'text',
    length: 2048,
  })
  @v.IsString()
  @v.Length(2, 2048)
    namespace!: string;

  @Column({
    type: 'text',
    length: 2048,
  })
  @CheckCurrencyCode()
  @v.Matches(/[a-zA-Z0-9]+/)
  @v.Length(2, 2048)
    mnemonic!: string;

  @Column({
    type: 'text',
    length: 2048,
    default: '',
  })
  @v.IsString()
  @v.IsOptional()
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
  @v.IsOptional()
  @v.IsString()
    cusip?: string;

  get stockerId(): string {
    return this.cusip || this.mnemonic;
  }
}

// https://github.com/typeorm/typeorm/issues/4714
Object.defineProperty(Commodity, 'name', { value: 'Commodity' });

/**
 * If CURRENCY is selected as namespace, it checks that the code is 3 chars long
 */
function CheckCurrencyCode(validationOptions?: v.ValidationOptions) {
  return function f(object: Commodity, propertyName: string) {
    v.registerDecorator({
      name: 'checkCurrencyCode',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(mnemonic: string, args: v.ValidationArguments) {
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
