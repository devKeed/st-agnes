import type { CloudinaryClient } from './cloudinary.provider';
import { DeleteResponseDto, UploadResponseDto } from './dto/upload-response.dto';
export declare class UploadService {
    private readonly cloudinary;
    private readonly logger;
    constructor(cloudinary: CloudinaryClient);
    uploadImage(file: Express.Multer.File, folder?: string): Promise<UploadResponseDto>;
    deleteImage(publicId: string): Promise<DeleteResponseDto>;
    private resolveFolder;
}
