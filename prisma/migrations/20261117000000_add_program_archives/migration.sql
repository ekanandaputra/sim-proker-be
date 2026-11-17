-- CreateTable
CREATE TABLE `program_archives` (
    `id` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `gdrive_url` VARCHAR(500) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `program_archives_year_key`(`year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
