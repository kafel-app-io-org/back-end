import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class Dropverificationcolumn1745141195811 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'verification_code');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'verification_code',
        type: 'varchar',
        isNullable: false,
      }),
    );
  }
}
