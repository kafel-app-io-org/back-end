import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddArabicNotification1751882616385 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'notifications',
      new TableColumn({
        name: 'arabic_title',
        type: 'varchar',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      'notifications',
      new TableColumn({
        name: 'arabic_details',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('notifications', 'arabic_title');
    await queryRunner.dropColumn('notifications', 'arabic_details');
  }
}
