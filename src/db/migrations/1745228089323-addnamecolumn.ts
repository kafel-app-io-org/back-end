import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class Addnamecolumn1745228089323 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'beneficiaries',
      new TableColumn({
        name: 'name',
        type: 'varchar',
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('beneficiaries', 'name');
  }
}
