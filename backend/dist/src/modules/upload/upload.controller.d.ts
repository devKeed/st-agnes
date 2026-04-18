import { UploadService } from './upload.service';
import { DeleteResponseDto, UploadResponseDto } from './dto/upload-response.dto';
export declare class UploadController {
    private readonly uploadService;
    constructor(uploadService: UploadService);
    upload(file: Express.Multer.File, folder?: string): Promise<UploadResponseDto>;
    remove(publicId: string): Promise<DeleteResponseDto>;
}
