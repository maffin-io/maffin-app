import {
  Column,
  Entity,
  OneToMany,
} from 'typeorm';
import {
  IsString,
} from 'class-validator';

import BaseEntity from './BaseEntity';
import type Account from './Account';

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
    (account: Account) => account.config,
  )
    accounts!: Account[];
}
