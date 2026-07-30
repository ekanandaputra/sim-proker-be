-- CreateTable
CREATE TABLE `program_indicator_realizations` (
    `id` VARCHAR(191) NOT NULL,
    `indicator_id` VARCHAR(191) NOT NULL,
    `month` SMALLINT NOT NULL,
    `realization` DECIMAL(10, 2) NOT NULL,
    `remark` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `program_indicator_realizations_indicator_id_idx`(`indicator_id`),
    UNIQUE INDEX `program_indicator_realizations_indicator_id_month_key`(`indicator_id`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `program_indicator_realizations` ADD CONSTRAINT `program_indicator_realizations_indicator_id_fkey` FOREIGN KEY (`indicator_id`) REFERENCES `program_indicators`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
