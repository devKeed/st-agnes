import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { UploadApiResponse } from 'cloudinary';
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

  constructor(@Inject(CLOUDINARY) private readonly cloudinary: CloudinaryClient) {}

  async uploadImage(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UploadResponseDto> {
    const targetFolder = this.resolveFolder(folder);

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
      throw new InternalServerErrorException('Image upload failed');
    }
  }

  async deleteImage(publicId: string): Promise<DeleteResponseDto> {
    if (!publicId || publicId.trim() === '') {
      throw new BadRequestException('publicId is required');
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

  private resolveFolder(folder?: string): string {
    if (!folder) return DEFAULT_FOLDER;
    if (ALLOWED_FOLDERS.has(folder)) return folder;
    throw new BadRequestException(
      `Invalid folder. Allowed: ${Array.from(ALLOWED_FOLDERS).join(', ')}`,
    );
  }
}
