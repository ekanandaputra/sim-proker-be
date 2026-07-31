/*
  Warnings:

  - You are about to drop the column `unit` on the `default_program_indicators` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `program_indicators` table. All the data in the column will be lost.
  - Added the required column `master_unit_type_id` to the `default_program_indicators` table without a default value. This is not possible if the table is not empty.
  - Added the required column `master_unit_type_id` to the `program_indicators` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `default_program_indicators` DROP COLUMN `unit`,
    ADD COLUMN `master_unit_type_id` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `program_indicators` DROP COLUMN `unit`,
    ADD COLUMN `master_unit_type_id` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `program_indicators` ADD CONSTRAINT `program_indicators_master_unit_type_id_fkey` FOREIGN KEY (`master_unit_type_id`) REFERENCES `master_unit_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `default_program_indicators` ADD CONSTRAINT `default_program_indicators_master_unit_type_id_fkey` FOREIGN KEY (`master_unit_type_id`) REFERENCES `master_unit_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
