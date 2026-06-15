import { registerAs } from '@nestjs/config';

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  secure: boolean;
  /** Maximum upload size in bytes (default: 10 MB) */
  maxFileSize: number;
  /** Default folder in Cloudinary for uploads */
  defaultFolder: string;
}

export default registerAs<CloudinaryConfig>('cloudinary', () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Cloudinary configuration missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment.',
    );
  }

  return {
    cloudName,
    apiKey,
    apiSecret,
    secure: process.env.CLOUDINARY_SECURE !== 'false',
    maxFileSize: parseInt(
      process.env.CLOUDINARY_MAX_FILE_SIZE || '10485760',
      10,
    ), // 10 MB
    defaultFolder: process.env.CLOUDINARY_DEFAULT_FOLDER || 'hr-system',
  };
});
