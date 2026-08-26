-- CreateTable
CREATE TABLE `master_budgets` (
    `id` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `budget` DECIMAL(20, 2) NOT NULL,
    `realization` DECIMAL(20, 2) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `master_budgets_year_key`(`year`),
    INDEX `master_budgets_year_idx`(`year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
