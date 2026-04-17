import { Provider, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export const CLOUDINARY = Symbol('CLOUDINARY');

export type CloudinaryClient = typeof cloudinary;

export const CloudinaryProvider: Provider<CloudinaryClient> = {
  provide: CLOUDINARY,
  inject: [ConfigService],
  useFactory: (config: ConfigService): CloudinaryClient => {
    const logger = new Logger('CloudinaryProvider');
    const cloudName = config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = config.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      logger.warn(
        'Cloudinary env vars missing (CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET). Upload endpoints will fail until configured.',
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    return cloudinary;
  },
};
