import {
  Entity,
  JoinColumn,
  OneToOne,
} from 'typeorm';

import BaseEntity from './BaseEntity';
import Account from './Account';

/**
 * https://wiki.gnucash.org/wiki/SQL#Books
 * CREATE TABLE books (
 *   guid                CHAR(32) PRIMARY KEY NOT NULL,
 *   root_account_guid   CHAR(32) NOT NULL,
 *   root_template_guid  CHAR(32) NOT NULL
 * );
*/

@Entity('books')
export default class Book extends BaseEntity {
  @OneToOne(() => Account, { eager: true })
  @JoinColumn({ name: 'root_account_guid' })
    fk_root!: Account | string;

  get root(): Account {
    return this.fk_root as Account;
  }
}

// https://github.com/typeorm/typeorm/issues/4714
Object.defineProperty(Book, 'name', { value: 'Book' });
