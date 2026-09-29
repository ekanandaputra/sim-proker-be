import 'multer';

/**
 * Storage service interface.
 * Abstracts file storage operations for easy replacement
 * (e.g., Local → S3 → MinIO → Azure Blob).
 */
export interface IStorageService {
  /**
   * Upload a file to storage.
   * @param fileNameOverride Base file name (without extension) to store the file as,
   *   instead of an auto-generated one. The original file's extension is always appended.
   * @returns The relative path of the uploaded file.
   */
  upload(file: Express.Multer.File, directory: string, fileNameOverride?: string): Promise<string>;

  /**
   * Delete a file from storage.
   * @param filePath The relative path of the file to delete.
   */
  delete(filePath: string): Promise<void>;

  /**
   * Get the full URL/path for a stored file.
   * @param filePath The relative path of the file.
   */
  getUrl(filePath: string): string;

  /**
   * Read a stored file's contents.
   * @param filePath The relative path of the file.
   */
  read(filePath: string): Promise<Buffer>;
}

export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');
