import { Injectable, Logger } from '@nestjs/common';
import 'multer';
import { IStorageService } from './storage.interface';
import { getAppConfig } from '@common/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LocalStorageService implements IStorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly uploadDir: string;

  constructor() {
    this.uploadDir = getAppConfig().UPLOAD_DIR;
    this.ensureDirectoryExists(this.uploadDir);
  }

  async upload(file: Express.Multer.File, directory: string): Promise<string> {
    const targetDir = path.join(this.uploadDir, directory);
    this.ensureDirectoryExists(targetDir);

    const ext = path.extname(file.originalname);
    const fileName = `${uuidv4()}${ext}`;
    const filePath = path.join(directory, fileName);
    const fullPath = path.join(this.uploadDir, filePath);

    await fs.promises.writeFile(fullPath, file.buffer);
    this.logger.log(`File uploaded: ${filePath}`);

    return filePath;
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.uploadDir, filePath);

    try {
      await fs.promises.unlink(fullPath);
      this.logger.log(`File deleted: ${filePath}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
      this.logger.warn(`File not found for deletion: ${filePath}`);
    }
  }

  getUrl(filePath: string): string {
    return `/${this.uploadDir}/${filePath}`;
  }

  private ensureDirectoryExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
