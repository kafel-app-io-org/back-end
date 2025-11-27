import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddVideoToUsersAndCampaign1756710287006
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'video_url',
        type: 'varchar',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      'campaigns',
      new TableColumn({
        name: 'video_url',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('campaigns', 'video_url');
    await queryRunner.dropColumn('users', 'video_url');
  }
}
