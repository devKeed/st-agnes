import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { UploadApiResponse } from 'cloudinary';
import { extname, join } from 'path';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { CLOUDINARY } from './cloudinary.provider';
import type { CloudinaryClient } from './cloudinary.provider';
import { DeleteResponseDto, UploadResponseDto } from './dto/upload-response.dto';

const ALLOWED_FOLDERS = new Set([
  'st-agnes/rentals',
  'st-agnes/gallery',
  'st-agnes/content',
  'st-agnes/misc',
]);

const DEFAULT_FOLDER = 'st-agnes/misc';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly cloudinaryEnabled: boolean;
  private readonly uploadsDir: string;
  private readonly publicBaseUrl: string;

  constructor(
    @Inject(CLOUDINARY) private readonly cloudinary: CloudinaryClient,
    private readonly config: ConfigService,
  ) {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');
    this.cloudinaryEnabled = Boolean(cloudName && apiKey && apiSecret);

    this.uploadsDir = join(process.cwd(), 'uploads');
    const configuredBaseUrl = this.config.get<string>('BACKEND_PUBLIC_URL');
    if (configuredBaseUrl) {
      this.publicBaseUrl = configuredBaseUrl.replace(/\/$/, '');
    } else {
      const port = this.config.get<string>('PORT', '3001');
      this.publicBaseUrl = `http://localhost:${port}`;
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UploadResponseDto> {
    const targetFolder = this.resolveFolder(folder);

    if (!this.cloudinaryEnabled) {
      this.logger.warn(
        'Cloudinary is not configured. Falling back to local disk storage for uploads.',
      );
      return this.uploadImageLocally(file);
    }

    try {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const stream = this.cloudinary.uploader.upload_stream(
          {
            folder: targetFolder,
            resource_type: 'image',
            use_filename: false,
            unique_filename: true,
            overwrite: false,
          },
          (error, response) => {
            if (error || !response) {
              return reject(error ?? new Error('Cloudinary returned no response'));
            }
            resolve(response);
          },
        );
        stream.end(file.buffer);
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      };
    } catch (error) {
      this.logger.error(
        `Cloudinary upload failed (folder=${targetFolder}): ${(error as Error).message}`,
        (error as Error).stack,
      );
      this.logger.warn('Falling back to local disk storage due to Cloudinary upload failure.');
      return this.uploadImageLocally(file);
    }
  }

  async deleteImage(publicId: string): Promise<DeleteResponseDto> {
    if (!publicId || publicId.trim() === '') {
      throw new BadRequestException('publicId is required');
    }

    if (publicId.startsWith('local/')) {
      const filename = publicId.replace(/^local\//, '');
      const filePath = join(this.uploadsDir, filename);
      try {
        await unlink(filePath);
        return { result: 'ok', publicId };
      } catch {
        return { result: 'not found', publicId };
      }
    }

    if (!this.cloudinaryEnabled) {
      return { result: 'not found', publicId };
    }

    try {
      const result = await this.cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
        invalidate: true,
      });

      if (result.result !== 'ok' && result.result !== 'not found') {
        this.logger.warn(`Cloudinary destroy returned: ${result.result}`);
      }

      return { result: result.result, publicId };
    } catch (error) {
      this.logger.error(
        `Cloudinary delete failed (publicId=${publicId}): ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException('Image delete failed');
    }
  }

  private async uploadImageLocally(
    file: Express.Multer.File,
  ): Promise<UploadResponseDto> {
    await mkdir(this.uploadsDir, { recursive: true });

    const originalExt = extname(file.originalname).toLowerCase();
    const safeExt = originalExt || '.jpg';
    const filename = `${randomUUID()}${safeExt}`;
    const absolutePath = join(this.uploadsDir, filename);
    await writeFile(absolutePath, file.buffer);

    return {
      url: `${this.publicBaseUrl}/uploads/${filename}`,
      publicId: `local/${filename}`,
      format: safeExt.replace('.', ''),
      width: 0,
      height: 0,
      bytes: file.size,
    };
  }

  private resolveFolder(folder?: string): string {
    if (!folder) return DEFAULT_FOLDER;
    if (ALLOWED_FOLDERS.has(folder)) return folder;
    throw new BadRequestException(
      `Invalid folder. Allowed: ${Array.from(ALLOWED_FOLDERS).join(', ')}`,
    );
  }
}
