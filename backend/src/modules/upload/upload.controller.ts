import {
  BadRequestException,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  ParseFilePipeBuilder,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { AdminRole } from '@prisma/client';
import { Roles } from '../../common/decorators';
import { UploadService } from './upload.service';
import { DeleteResponseDto, UploadResponseDto } from './dto/upload-response.dto';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const filePipe = new ParseFilePipeBuilder()
  .addFileTypeValidator({ fileType: /(jpeg|jpg|png|webp)$/i })
  .addMaxSizeValidator({ maxSize: MAX_FILE_SIZE_BYTES })
  .build({ errorHttpStatusCode: HttpStatus.BAD_REQUEST });

@ApiTags('Upload')
@ApiBearerAuth()
@Controller('upload')
@Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @ApiOperation({ summary: 'Upload an image to Cloudinary (admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({
    name: 'folder',
    required: false,
    description:
      'Target folder (one of: st-agnes/rentals, st-agnes/gallery, st-agnes/content, st-agnes/misc). Defaults to st-agnes/misc.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
    }),
  )
  async upload(
    @UploadedFile(filePipe) file: Express.Multer.File,
    @Query('folder') folder?: string,
  ): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('file is required');
    }
    return this.uploadService.uploadImage(file, folder);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Delete an image from Cloudinary by publicId (admin only). publicId passed via query string because it may contain slashes.',
  })
  @ApiQuery({ name: 'publicId', required: true })
  async remove(@Query('publicId') publicId: string): Promise<DeleteResponseDto> {
    return this.uploadService.deleteImage(publicId);
  }
}
