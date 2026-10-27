import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ApprovalLevel, Prisma } from '@prisma/client';
import { Workbook } from 'exceljs';
import { Readable } from 'stream';
import { PaginatedResponse } from '@common/dto/pagination.dto';
import { AuthIntegrationService } from '../../external/auth-integration/services/auth-integration.service';
import { IkuIntegrationService } from '../../external/iku-integration/services/iku-integration.service';
import { APPROVAL_REVIEWER_REPOSITORY, IApprovalReviewerRepository } from '../repositories/approval-reviewer.repository.interface';
import { ApprovalReviewerImportResultDto } from '../dto/approval-reviewer-import.dto';

@Injectable()
export class ApprovalReviewerTransferService {
  constructor(
    @Inject(APPROVAL_REVIEWER_REPOSITORY) private readonly repository: IApprovalReviewerRepository,
    private readonly auth: AuthIntegrationService,
    private readonly iku: IkuIntegrationService,
  ) {}

  private async allPages<T>(fetchPage: (page: number) => Promise<PaginatedResponse<T>>): Promise<T[]> {
    const items: T[] = [];
    let page = 1;
    let totalPages = 1;
    do {
      const response = await fetchPage(page);
      items.push(...response.items);
      totalPages = response.pagination.totalPages;
      page++;
    } while (page <= totalPages);
    return items;
  }

  private async references(token: string) {
    const [ikus, users] = await Promise.all([
      this.allPages((page) => this.iku.getAllIkus(token, { page, limit: 100 })),
      this.allPages((page) => this.auth.getAllUsers(token, { page, limit: 100, sortOrder: 'asc' })),
    ]);
    return { ikus, users };
  }

  async exportExcel(token: string): Promise<Buffer> {
    const reviewers = await this.repository.findAll({ level: ApprovalLevel.INDICATOR_VERIFICATION });
    const { ikus, users } = reviewers.length ? await this.references(token) : { ikus: [], users: [] };
    const ikuById = new Map(ikus.map((iku) => [iku.id, iku]));
    const userById = new Map(users.map((user) => [user.id, user]));
    const workbook = new Workbook();
    const sheet = workbook.addWorksheet('Approval Reviewers');
    sheet.columns = [
      { header: 'IKU Code', key: 'ikuCode', width: 25 },
      { header: 'NIP', key: 'nip', width: 25, style: { numFmt: '@' } },
    ];
    sheet.getRow(1).font = { bold: true };
    for (const reviewer of reviewers) {
      const code = reviewer.ikuId ? ikuById.get(reviewer.ikuId)?.code : undefined;
      const nip = userById.get(reviewer.userId)?.nip;
      if (!code || typeof nip !== 'string' || !nip.trim()) {
        throw new BadRequestException(`IKU Code atau NIP tidak tersedia untuk reviewer ${reviewer.id}`);
      }
      sheet.addRow({ ikuCode: code, nip: nip.trim() });
    }
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async importExcel(file: Express.Multer.File | undefined, token: string): Promise<ApprovalReviewerImportResultDto> {
    if (!file || !file.originalname.toLowerCase().endsWith('.xlsx')) {
      throw new BadRequestException('Upload file Excel (.xlsx) dengan kolom IKU Code | NIP');
    }
    const workbook = new Workbook();
    try {
      await workbook.xlsx.read(Readable.from(file.buffer));
    } catch {
      throw new BadRequestException('File Excel tidak valid');
    }
    const sheet = workbook.worksheets[0];
    if (!sheet || sheet.getRow(1).getCell(1).text.trim().toLowerCase() !== 'iku code' || sheet.getRow(1).getCell(2).text.trim().toLowerCase() !== 'nip') {
      throw new BadRequestException('Header wajib: IKU Code | NIP');
    }
    const { ikus, users } = await this.references(token);
    // Keep duplicate reference values ambiguous rather than assigning an arbitrary user/IKU.
    const matchingIkus = (code: string) => ikus.filter((iku) => iku.code.trim().toLowerCase() === code.toLowerCase());
    const matchingUsers = (nip: string) => users.filter((user) => typeof user.nip === 'string' && user.nip.trim() === nip);
    const result: ApprovalReviewerImportResultDto = { totalRows: 0, success: 0, skipped: 0, details: [] };
    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
      const row = sheet.getRow(rowNumber);
      const ikuCode = row.getCell(1).text.trim();
      const nipCell = row.getCell(2);
      const nip = nipCell.text.trim();
      if (!ikuCode && !nip) continue;
      result.totalRows++;
      let reason: string | undefined;
      const ikuMatches = matchingIkus(ikuCode);
      const userMatches = matchingUsers(nip);
      if (!ikuCode || !nip) reason = 'IKU Code dan NIP wajib diisi';
      else if (typeof nipCell.value !== 'string') reason = 'NIP wajib berformat teks untuk menjaga keutuhan digit';
      else if (ikuMatches.length !== 1) reason = 'IKU Code tidak ditemukan atau ambigu';
      else if (userMatches.length !== 1) reason = 'NIP tidak ditemukan atau ambigu di Auth Service';
      else {
        const userId = userMatches[0].id;
        const ikuId = ikuMatches[0].id;
        const level = ApprovalLevel.INDICATOR_VERIFICATION;
        if (await this.repository.findByUserAndLevel(userId, level, ikuId)) {
          reason = 'Reviewer sudah terdaftar';
        } else {
          try {
            await this.repository.create({ userId, level, ikuId });
          } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') reason = 'Reviewer sudah terdaftar';
            else throw error;
          }
        }
      }
      if (reason) result.skipped++;
      else result.success++;
      result.details.push({ row: rowNumber, ikuCode, nip, status: reason ? 'skipped' : 'success', ...(reason ? { reason } : {}) });
    }
    return result;
  }
}
