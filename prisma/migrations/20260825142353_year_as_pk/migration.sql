/*
  Warnings:

  - The primary key for the `master_budgets` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `master_budgets` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `master_budgets_year_idx` ON `master_budgets`;

-- DropIndex
DROP INDEX `master_budgets_year_key` ON `master_budgets`;

-- AlterTable
ALTER TABLE `master_budgets` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    ADD PRIMARY KEY (`year`);
