// example TypeORM migration (MySQL)
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeletedByToNfcDevice1756711678899 implements MigrationInterface {
  name = 'AddDeletedByToNfcDevice1756711678899'
  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      ALTER TABLE nfc_devices
      ADD COLUMN deleted_by INT NULL
      -- optionally add FK if it should reference users(id):
      -- , ADD CONSTRAINT fk_nfc_device_deleted_by
      --   FOREIGN KEY (deleted_by) REFERENCES users(id)
      --   ON DELETE SET NULL ON UPDATE CASCADE
    `);
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.query(`
      ALTER TABLE nfc_devices
      DROP COLUMN deleted_by
    `);
  }
}
