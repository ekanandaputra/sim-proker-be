-- CreateTable
CREATE TABLE `default_program_indicators` (
    `id` VARCHAR(191) NOT NULL,
    `default_program_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `unit` VARCHAR(50) NOT NULL,
    `target` DECIMAL(10, 2) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `default_program_indicators_default_program_id_idx`(`default_program_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `default_program_indicators` ADD CONSTRAINT `default_program_indicators_default_program_id_fkey` FOREIGN KEY (`default_program_id`) REFERENCES `default_programs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
