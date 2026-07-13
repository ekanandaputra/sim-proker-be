-- CreateTable
CREATE TABLE `default_programs` (
    `id` VARCHAR(191) NOT NULL,
    `iku_id` VARCHAR(100) NOT NULL,
    `iku_code` VARCHAR(50) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `default_programs_iku_id_idx`(`iku_id`),
    INDEX `default_programs_iku_code_idx`(`iku_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
