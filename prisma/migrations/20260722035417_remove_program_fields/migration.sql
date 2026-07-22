/*
  Warnings:

  - You are about to drop the column `budget` on the `programs` table. All the data in the column will be lost.
  - You are about to drop the column `category_id` on the `programs` table. All the data in the column will be lost.
  - You are about to drop the column `end_date` on the `programs` table. All the data in the column will be lost.
  - You are about to drop the column `start_date` on the `programs` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `programs` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `programs` DROP FOREIGN KEY `programs_category_id_fkey`;

-- DropIndex
DROP INDEX `programs_category_id_idx` ON `programs`;

-- DropIndex
DROP INDEX `programs_status_idx` ON `programs`;

-- AlterTable
ALTER TABLE `programs` DROP COLUMN `budget`,
    DROP COLUMN `category_id`,
    DROP COLUMN `end_date`,
    DROP COLUMN `start_date`,
    DROP COLUMN `status`;
