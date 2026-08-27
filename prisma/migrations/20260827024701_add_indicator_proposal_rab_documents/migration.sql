-- AlterTable
ALTER TABLE `program_indicators` ADD COLUMN `proposal_document_id` VARCHAR(191) NULL,
    ADD COLUMN `rab_document_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `program_indicators_proposal_document_id_idx` ON `program_indicators`(`proposal_document_id`);

-- CreateIndex
CREATE INDEX `program_indicators_rab_document_id_idx` ON `program_indicators`(`rab_document_id`);

-- AddForeignKey
ALTER TABLE `program_indicators` ADD CONSTRAINT `program_indicators_proposal_document_id_fkey` FOREIGN KEY (`proposal_document_id`) REFERENCES `documents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `program_indicators` ADD CONSTRAINT `program_indicators_rab_document_id_fkey` FOREIGN KEY (`rab_document_id`) REFERENCES `documents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
