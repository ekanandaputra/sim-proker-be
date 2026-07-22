/*
  Warnings:

  - You are about to drop the column `target` on the `default_program_indicators` table. All the data in the column will be lost.
  - You are about to drop the column `target` on the `program_indicators` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `default_program_indicators` DROP COLUMN `target`;

-- AlterTable
ALTER TABLE `program_indicators` DROP COLUMN `target`,
    ADD COLUMN `status` ENUM('ASSIGNED_TO_UNIT', 'DRAFT', 'SUBMITTED', 'REVISION', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN `target_q1` DECIMAL(10, 2) NULL,
    ADD COLUMN `target_q2` DECIMAL(10, 2) NULL,
    ADD COLUMN `target_q3` DECIMAL(10, 2) NULL,
    ADD COLUMN `target_q4` DECIMAL(10, 2) NULL;
