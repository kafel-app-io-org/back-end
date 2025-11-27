import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class Account1745682590753 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'accounts',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'system_role',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'campaign_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'normal_balance',
            type: 'enum',
            enum: ['credit', 'debit'],
            default: `'debit'`,
          },
          {
            name: 'posted_balance',
            type: 'integer',
            default: 0,
          },
          {
            name: 'available_balance',
            type: 'integer',
            default: 0,
          },
          {
            name: 'pending_balance',
            type: 'integer',
            default: 0,
          },
          {
            name: 'account_number',
            type: 'varchar',
            isUnique: true,
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['asset', 'liability', 'equity', 'revenue', 'expense'],
            default: `'asset'`,
          },
          {
            name: 'currency',
            type: 'varchar',
            default: `'USDT'`,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'archived'],
            default: `'active'`,
          },
          {
            name: 'is_contra_account',
            type: 'boolean',
            default: false,
          },
          {
            name: 'parent_account_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
            onUpdate: 'now()',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            default: null,
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'int',
            isNullable: true,
            default: null,
          },
          {
            name: 'updated_by',
            type: 'int',
            isNullable: true,
            default: null,
          },
          {
            name: 'deleted_by',
            type: 'int',
            isNullable: true,
            default: null,
          },
        ],
      }),
    );
    await queryRunner.createForeignKeys('accounts', [
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
      }),
      new TableForeignKey({
        columnNames: ['campaign_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'campaigns',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('accounts');
  }
}
