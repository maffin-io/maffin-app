import {
  MigrationInterface,
  QueryRunner,
} from 'typeorm';

/**
 * The migration adds a new fullname field to Commodities table
 */
export class AddCommodityName1697688851711 implements MigrationInterface {
  // eslint-disable-next-line class-methods-use-this
  public async up(queryRunner: QueryRunner): Promise<void> {
    const columnExists = await queryRunner.hasColumn('commodities', 'fullname');
    if (!columnExists) {
      await queryRunner.query(
        'ALTER TABLE "commodities" ADD COLUMN "fullname" VARCHAR(2048) DEFAULT \'\'',
      );
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public async down(): Promise<void> {
    'unimplemented';
  }
}
