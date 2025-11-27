import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnsToUserTable1751663614448 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'icon',
        type: 'varchar',
        isNullable: true,
        default: null,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'overview',
        type: 'TEXT',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'overview');
    await queryRunner.dropColumn('users', 'icon');
  }
}
