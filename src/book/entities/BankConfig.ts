import {
  Column,
  Entity,
  OneToMany,
} from 'typeorm';
import {
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

import BaseEntity from './BaseEntity';
import Account from './Account';

@Entity('bank_config')
export default class BankConfig extends BaseEntity {
  @Column({
    type: 'text',
    length: 2048,
  })
  @IsString()
    token!: string;

  @OneToMany(
    'Account',
    (account: Account) => account.fk_config,
  )
  @Type(() => Account)
    accounts!: Account[];
}

// https://github.com/typeorm/typeorm/issues/4714
Object.defineProperty(BankConfig, 'name', { value: 'BankConfig' });
