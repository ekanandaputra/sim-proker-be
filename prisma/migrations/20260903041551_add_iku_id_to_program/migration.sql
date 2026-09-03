-- AlterTable
ALTER TABLE `programs` ADD COLUMN `iku_id` VARCHAR(50) NULL;

-- CreateIndex
CREATE INDEX `programs_iku_id_idx` ON `programs`(`iku_id`);
