import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

/**
 * The migration adds a new BankConfig table and the relation with the Account
 */
export class AddBankConfig1717405195056 implements MigrationInterface {
  // eslint-disable-next-line class-methods-use-this
  public async up(queryRunner: QueryRunner): Promise<void> {
    const columnExists = await queryRunner.hasColumn('accounts', 'bank_config');
    if (!columnExists) {
      await queryRunner.query(
        'ALTER TABLE "accounts" ADD COLUMN "config_guid" VARCHAR(32)',
      );

      await queryRunner.createForeignKey(
        'accounts',
        new TableForeignKey({
          columnNames: ['config_guid'],
          referencedColumnNames: ['guid'],
          referencedTableName: 'bank_config',
        }),
      );
    }

    const tableExists = await queryRunner.hasTable('bank_config');
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'bank_config',
          columns: [
            {
              name: 'guid',
              type: 'varchar',
              length: '32',
              isPrimary: true,
            },
            {
              name: 'token',
              type: 'varchar',
              length: '2048',
            },
          ],
        }),
      );
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public async down(): Promise<void> {
    'unimplemented';
  }
}

Object.defineProperty(AddBankConfig1717405195056, 'name', { value: 'AddBankConfig1717405195056' });
