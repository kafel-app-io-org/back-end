import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UserMethodPref1746292255456 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'withdraw_method_preference',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'withdraw_method_preference');
  }
}
