import { ProgramStatus } from '@prisma/client';

/** Indonesian labels for ProgramStatus, used by the Excel exports. */
export const PROGRAM_STATUS_LABELS: Record<ProgramStatus, string> = {
  ASSIGNED_TO_UNIT: 'Ditugaskan ke Unit',
  DRAFT: 'Draft',
  SUBMITTED: 'Diajukan',
  REVISION: 'Revisi',
  INDICATOR_APPROVED: 'Indikator Disetujui',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
  IN_PROGRESS: 'Berjalan',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

/** Statuses currently used in the program workflow, in display order (DRAFT etc. are unused). */
export const ACTIVE_PROGRAM_STATUSES = [
  ProgramStatus.ASSIGNED_TO_UNIT,
  ProgramStatus.SUBMITTED,
  ProgramStatus.APPROVED,
  ProgramStatus.REJECTED,
  ProgramStatus.REVISION,
  ProgramStatus.IN_PROGRESS,
] as const;
