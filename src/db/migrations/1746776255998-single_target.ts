import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class SingleTarget1746776255998 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'campaigns',
      new TableColumn({
        name: 'single_target',
        type: 'integer',
        isNullable: false,
        default: 1,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('campaigns', 'single_target');
  }
}
