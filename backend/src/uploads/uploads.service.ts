import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const MAX_BYTES = 5 * 1024 * 1024;

@Injectable()
export class UploadsService {
  private readonly uploadDir: string;

  constructor(private config: ConfigService) {
    this.uploadDir = this.config.get<string>('UPLOAD_DIR', join(process.cwd(), 'uploads'));
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  saveImage(file: Express.Multer.File): string {
    if (!file?.buffer?.length) {
      throw new BadRequestException('File is required');
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('File too large (max 5 MB)');
    }

    const ext = extname(file.originalname).toLowerCase() || '.jpg';
    if (!ALLOWED_EXT.has(ext)) {
      throw new BadRequestException('Allowed formats: JPG, PNG, WebP');
    }

    const filename = `${randomUUID()}${ext}`;
    writeFileSync(join(this.uploadDir, filename), file.buffer);
    return `/api/uploads/files/${filename}`;
  }

  getFilePath(filename: string): string {
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '');
    return join(this.uploadDir, safe);
  }
}
