/*
  Warnings:

  - You are about to alter the column `level` on the `approvals` table. The data in that column could be lost. The data in that column will be cast from `SmallInt` to `Enum(EnumId(7))`.

*/
-- AlterTable
ALTER TABLE `approvals` MODIFY `level` ENUM('INDICATOR_VERIFICATION', 'BUDGET_VERIFICATION') NOT NULL DEFAULT 'INDICATOR_VERIFICATION';

-- AlterTable
ALTER TABLE `default_program_indicators` ADD COLUMN `category` ENUM('TUSI', 'RUTIN', 'PENGEMBANGAN') NOT NULL DEFAULT 'TUSI';

-- AlterTable
ALTER TABLE `program_indicators` ADD COLUMN `category` ENUM('TUSI', 'RUTIN', 'PENGEMBANGAN') NOT NULL DEFAULT 'TUSI',
    MODIFY `status` ENUM('ASSIGNED_TO_UNIT', 'DRAFT', 'SUBMITTED', 'REVISION', 'INDICATOR_APPROVED', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'SUBMITTED';

-- CreateTable
CREATE TABLE `approval_reviewers` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(100) NOT NULL,
    `level` ENUM('INDICATOR_VERIFICATION', 'BUDGET_VERIFICATION') NOT NULL,
    `iku_id` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `approval_reviewers_level_idx`(`level`),
    INDEX `approval_reviewers_iku_id_idx`(`iku_id`),
    UNIQUE INDEX `approval_reviewers_user_id_level_iku_id_key`(`user_id`, `level`, `iku_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
