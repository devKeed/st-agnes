import { Provider } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
export declare const CLOUDINARY: unique symbol;
export type CloudinaryClient = typeof cloudinary;
export declare const CloudinaryProvider: Provider<CloudinaryClient>;
