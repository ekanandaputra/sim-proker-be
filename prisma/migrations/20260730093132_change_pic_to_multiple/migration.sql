/*
  Warnings:

  - You are about to drop the column `pic` on the `program_indicators` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `program_indicators` DROP COLUMN `pic`;

-- CreateTable
CREATE TABLE `program_indicator_pics` (
    `id` VARCHAR(191) NOT NULL,
    `indicator_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `program_indicator_pics_indicator_id_idx`(`indicator_id`),
    INDEX `program_indicator_pics_user_id_idx`(`user_id`),
    UNIQUE INDEX `program_indicator_pics_indicator_id_user_id_key`(`indicator_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `program_indicator_pics` ADD CONSTRAINT `program_indicator_pics_indicator_id_fkey` FOREIGN KEY (`indicator_id`) REFERENCES `program_indicators`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
