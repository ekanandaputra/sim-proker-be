/*
  Warnings:

  - You are about to drop the column `iku_code` on the `default_programs` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `default_programs_iku_code_idx` ON `default_programs`;

-- AlterTable
ALTER TABLE `default_programs` DROP COLUMN `iku_code`;
