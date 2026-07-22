/*
  Warnings:

  - You are about to drop the column `unit_id` on the `programs` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE `program_indicators` (
    `id` VARCHAR(191) NOT NULL,
    `program_id` VARCHAR(191) NOT NULL,
    `unit_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `unit` VARCHAR(50) NOT NULL,
    `target` DECIMAL(10, 2) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `program_indicators_program_id_idx`(`program_id`),
    INDEX `program_indicators_unit_id_idx`(`unit_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `program_indicators` ADD CONSTRAINT `program_indicators_program_id_fkey` FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Data Migration
INSERT INTO `program_indicators` (`id`, `program_id`, `unit_id`, `name`, `unit`, `target`, `order`, `updated_at`)
SELECT UUID(), `id`, `unit_id`, 'Default Indicator', 'N/A', NULL, 0, NOW(3)
FROM `programs`
WHERE `unit_id` IS NOT NULL;

-- DropIndex
DROP INDEX `programs_unit_id_idx` ON `programs`;

-- AlterTable
ALTER TABLE `programs` DROP COLUMN `unit_id`;
