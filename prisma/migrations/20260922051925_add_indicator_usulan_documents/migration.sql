-- AlterTable
ALTER TABLE `program_indicators` ADD COLUMN `usulan_bahan_habis_document_id` VARCHAR(191) NULL,
    ADD COLUMN `usulan_meubelair_document_id` VARCHAR(191) NULL,
    ADD COLUMN `usulan_pelatihan_document_id` VARCHAR(191) NULL,
    ADD COLUMN `usulan_peralatan_document_id` VARCHAR(191) NULL,
    ADD COLUMN `usulan_perbaikan_document_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `program_indicators_usulan_perbaikan_document_id_idx` ON `program_indicators`(`usulan_perbaikan_document_id`);

-- CreateIndex
CREATE INDEX `program_indicators_usulan_bahan_habis_document_id_idx` ON `program_indicators`(`usulan_bahan_habis_document_id`);

-- CreateIndex
CREATE INDEX `program_indicators_usulan_peralatan_document_id_idx` ON `program_indicators`(`usulan_peralatan_document_id`);

-- CreateIndex
CREATE INDEX `program_indicators_usulan_pelatihan_document_id_idx` ON `program_indicators`(`usulan_pelatihan_document_id`);

-- CreateIndex
CREATE INDEX `program_indicators_usulan_meubelair_document_id_idx` ON `program_indicators`(`usulan_meubelair_document_id`);

-- AddForeignKey
ALTER TABLE `program_indicators` ADD CONSTRAINT `program_indicators_usulan_perbaikan_document_id_fkey` FOREIGN KEY (`usulan_perbaikan_document_id`) REFERENCES `documents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `program_indicators` ADD CONSTRAINT `program_indicators_usulan_bahan_habis_document_id_fkey` FOREIGN KEY (`usulan_bahan_habis_document_id`) REFERENCES `documents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `program_indicators` ADD CONSTRAINT `program_indicators_usulan_peralatan_document_id_fkey` FOREIGN KEY (`usulan_peralatan_document_id`) REFERENCES `documents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `program_indicators` ADD CONSTRAINT `program_indicators_usulan_pelatihan_document_id_fkey` FOREIGN KEY (`usulan_pelatihan_document_id`) REFERENCES `documents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `program_indicators` ADD CONSTRAINT `program_indicators_usulan_meubelair_document_id_fkey` FOREIGN KEY (`usulan_meubelair_document_id`) REFERENCES `documents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
