import { ConfigService } from '@nestjs/config';
import type { CloudinaryClient } from './cloudinary.provider';
import { DeleteResponseDto, UploadResponseDto } from './dto/upload-response.dto';
export declare class UploadService {
    private readonly cloudinary;
    private readonly config;
    private readonly logger;
    private readonly cloudinaryEnabled;
    private readonly uploadsDir;
    private readonly publicBaseUrl;
    constructor(cloudinary: CloudinaryClient, config: ConfigService);
    uploadImage(file: Express.Multer.File, folder?: string): Promise<UploadResponseDto>;
    deleteImage(publicId: string): Promise<DeleteResponseDto>;
    private uploadImageLocally;
    private resolveFolder;
}
