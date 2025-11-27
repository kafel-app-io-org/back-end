// example TypeORM migration (MySQL)
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeletedAtToNfcDevice1756711678900 implements MigrationInterface {
  name = 'AddDeletedAtToNfcDevice1756711678900'
  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      ALTER TABLE nfc_devices
      ADD COLUMN deleted_at INT NULL
      -- optionally add FK if it should reference users(id):
      -- , ADD CONSTRAINT fk_nfc_device_deleted_at
      --   FOREIGN KEY (deleted_at) REFERENCES users(id)
      --   ON DELETE SET NULL ON UPDATE CASCADE
    `);
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.query(`
      ALTER TABLE nfc_devices
      DROP COLUMN deleted_at
    `);
  }
}
