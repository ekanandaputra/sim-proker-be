/*
  Warnings:

  - You are about to drop the column `usulan_bahan_habis_document_id` on the `program_indicators` table. All the data in the column will be lost.
  - You are about to drop the column `usulan_meubelair_document_id` on the `program_indicators` table. All the data in the column will be lost.
  - You are about to drop the column `usulan_pelatihan_document_id` on the `program_indicators` table. All the data in the column will be lost.
  - You are about to drop the column `usulan_peralatan_document_id` on the `program_indicators` table. All the data in the column will be lost.
  - You are about to drop the column `usulan_perbaikan_document_id` on the `program_indicators` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `program_indicators` DROP FOREIGN KEY `program_indicators_usulan_bahan_habis_document_id_fkey`;

-- DropForeignKey
ALTER TABLE `program_indicators` DROP FOREIGN KEY `program_indicators_usulan_meubelair_document_id_fkey`;

-- DropForeignKey
ALTER TABLE `program_indicators` DROP FOREIGN KEY `program_indicators_usulan_pelatihan_document_id_fkey`;

-- DropForeignKey
ALTER TABLE `program_indicators` DROP FOREIGN KEY `program_indicators_usulan_peralatan_document_id_fkey`;

-- DropForeignKey
ALTER TABLE `program_indicators` DROP FOREIGN KEY `program_indicators_usulan_perbaikan_document_id_fkey`;

-- DropIndex
DROP INDEX `program_indicators_usulan_bahan_habis_document_id_idx` ON `program_indicators`;

-- DropIndex
DROP INDEX `program_indicators_usulan_meubelair_document_id_idx` ON `program_indicators`;

-- DropIndex
DROP INDEX `program_indicators_usulan_pelatihan_document_id_idx` ON `program_indicators`;

-- DropIndex
DROP INDEX `program_indicators_usulan_peralatan_document_id_idx` ON `program_indicators`;

-- DropIndex
DROP INDEX `program_indicators_usulan_perbaikan_document_id_idx` ON `program_indicators`;

-- AlterTable
ALTER TABLE `program_indicators` DROP COLUMN `usulan_bahan_habis_document_id`,
    DROP COLUMN `usulan_meubelair_document_id`,
    DROP COLUMN `usulan_pelatihan_document_id`,
    DROP COLUMN `usulan_peralatan_document_id`,
    DROP COLUMN `usulan_perbaikan_document_id`;
