import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class OrganizerAddImage1746291047982 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'organizer_profile',
      new TableColumn({
        name: 'image',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('organizer_profile', 'image');
  }
}
