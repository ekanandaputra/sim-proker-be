-- CreateTable
CREATE TABLE `unit_budget_proposals` (
    `id` VARCHAR(191) NOT NULL,
    `unit_id` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `perbaikan_document_id` VARCHAR(191) NULL,
    `perbaikan_value` DECIMAL(20, 2) NULL,
    `bahan_habis_document_id` VARCHAR(191) NULL,
    `bahan_habis_value` DECIMAL(20, 2) NULL,
    `peralatan_document_id` VARCHAR(191) NULL,
    `peralatan_value` DECIMAL(20, 2) NULL,
    `pelatihan_document_id` VARCHAR(191) NULL,
    `pelatihan_value` DECIMAL(20, 2) NULL,
    `meubelair_document_id` VARCHAR(191) NULL,
    `meubelair_value` DECIMAL(20, 2) NULL,
    `created_by` VARCHAR(191) NOT NULL,
    `updated_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `unit_budget_proposals_perbaikan_document_id_idx`(`perbaikan_document_id`),
    INDEX `unit_budget_proposals_bahan_habis_document_id_idx`(`bahan_habis_document_id`),
    INDEX `unit_budget_proposals_peralatan_document_id_idx`(`peralatan_document_id`),
    INDEX `unit_budget_proposals_pelatihan_document_id_idx`(`pelatihan_document_id`),
    INDEX `unit_budget_proposals_meubelair_document_id_idx`(`meubelair_document_id`),
    UNIQUE INDEX `unit_budget_proposals_unit_id_year_key`(`unit_id`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `unit_budget_proposals` ADD CONSTRAINT `unit_budget_proposals_perbaikan_document_id_fkey` FOREIGN KEY (`perbaikan_document_id`) REFERENCES `documents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `unit_budget_proposals` ADD CONSTRAINT `unit_budget_proposals_bahan_habis_document_id_fkey` FOREIGN KEY (`bahan_habis_document_id`) REFERENCES `documents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `unit_budget_proposals` ADD CONSTRAINT `unit_budget_proposals_peralatan_document_id_fkey` FOREIGN KEY (`peralatan_document_id`) REFERENCES `documents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `unit_budget_proposals` ADD CONSTRAINT `unit_budget_proposals_pelatihan_document_id_fkey` FOREIGN KEY (`pelatihan_document_id`) REFERENCES `documents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `unit_budget_proposals` ADD CONSTRAINT `unit_budget_proposals_meubelair_document_id_fkey` FOREIGN KEY (`meubelair_document_id`) REFERENCES `documents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

