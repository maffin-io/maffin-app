import {
  MigrationInterface,
  QueryRunner,
} from 'typeorm';

/**
 * Adds a report flag to accounts. Accounts with report=false are
 * excluded from PDF reports. Defaults to true for existing accounts.
 */
export class AddAccountReport1770500000000 implements MigrationInterface {
  // eslint-disable-next-line class-methods-use-this
  public async up(queryRunner: QueryRunner): Promise<void> {
    const columnExists = await queryRunner.hasColumn('accounts', 'report');
    if (!columnExists) {
      await queryRunner.query(
        'ALTER TABLE "accounts" ADD COLUMN "report" boolean NOT NULL DEFAULT true',
      );
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public async down(): Promise<void> {
    'unimplemented';
  }
}

Object.defineProperty(AddAccountReport1770500000000, 'name', { value: 'AddAccountReport1770500000000' });
