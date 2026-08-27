-- AlterTable
ALTER TABLE `program_indicator_realizations` ADD COLUMN `value_text` TEXT NULL,
    MODIFY `realization` DECIMAL(10, 2) NULL;

-- AlterTable
ALTER TABLE `program_indicators` ADD COLUMN `value_type` ENUM('NUMBER', 'TEXT', 'FILE') NOT NULL DEFAULT 'NUMBER';
