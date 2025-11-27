import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCodeToLocations1746876829062 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'locations',
      new TableColumn({
        name: 'code',
        type: 'varchar',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('locations', 'code');
  }
}
