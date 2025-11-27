import { MigrationInterface, QueryRunner } from "typeorm";

// Use your own timestamp if you already created the file with another one
export class AddAuditColsToNfcOfflineTokens1756711679901 implements MigrationInterface {
  name = 'AddAuditColsToNfcOfflineTokens1756711679901';

  public async up(qr: QueryRunner): Promise<void> {
    // Add columns (nullable; adjust types if you prefer BIGINT, etc.)
    await qr.query(`
      ALTER TABLE nfc_offline_tokens
        ADD COLUMN created_by INT NULL,
        ADD COLUMN updated_by INT NULL,
        ADD COLUMN deleted_by INT NULL,
        ADD COLUMN deleted_at DATETIME NULL
    `);

    // (Optional) add foreign keys if these should reference users(id)
    await qr.query(`
      ALTER TABLE nfc_offline_tokens
        ADD CONSTRAINT fk_nfc_offline_tokens_created_by
          FOREIGN KEY (created_by) REFERENCES users(id)
          ON DELETE SET NULL ON UPDATE CASCADE,
        ADD CONSTRAINT fk_nfc_offline_tokens_updated_by
          FOREIGN KEY (updated_by) REFERENCES users(id)
          ON DELETE SET NULL ON UPDATE CASCADE,
        ADD CONSTRAINT fk_nfc_offline_tokens_deleted_by
          FOREIGN KEY (deleted_by) REFERENCES users(id)
          ON DELETE SET NULL ON UPDATE CASCADE
    `);

    // (Optional) index deleted_at if you’ll filter by non-deleted frequently
    // await qr.query(`CREATE INDEX idx_nfc_offline_tokens_deleted_at ON nfc_offline_tokens (deleted_at)`); 
  }

  public async down(qr: QueryRunner): Promise<void> {
    // Drop optional FKs first if you added them
    // await qr.query(`
    //   ALTER TABLE nfc_offline_tokens
    //     DROP FOREIGN KEY fk_nfc_offline_tokens_created_by,
    //     DROP FOREIGN KEY fk_nfc_offline_tokens_updated_by,
    //     DROP FOREIGN KEY fk_nfc_offline_tokens_deleted_by
    // `);
    // await qr.query(`DROP INDEX idx_nfc_offline_tokens_deleted_at ON nfc_offline_tokens`);

    await qr.query(`
      ALTER TABLE nfc_offline_tokens
        DROP COLUMN deleted_at,
        DROP COLUMN deleted_by,
        DROP COLUMN updated_by,
        DROP COLUMN created_by
    `);
  }
}
