import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'node:stream';
import type { CloudinaryConfig } from '../../config/cloudinary.config';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface UploadOptions {
  folder?: string;
  resourceType?: 'image' | 'raw' | 'video' | 'auto';
  tags?: string[];
  publicId?: string;
  transformation?: TransformationOptions;
  /** Overwrite existing file with same public ID */
  overwrite?: boolean;
}

export interface TransformationOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'limit' | 'scale' | 'thumb';
  quality?: string | number;
  format?: string;
}

export interface UploadResult {
  publicId: string;
  secureUrl: string;
  url: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  resourceType: string;
  createdAt: string;
}

export interface SignedUrlResult {
  url: string;
  expiresAt: number;
}

// ── Allowed MIME types ────────────────────────────────────────────────────────

const IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
]);

const DOCUMENT_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
]);

const VIDEO_MIMES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
]);

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class CloudinaryService implements OnModuleInit {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly config: CloudinaryConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<CloudinaryConfig>('cloudinary')!;
  }

  onModuleInit(): void {
    cloudinary.config({
      cloud_name: this.config.cloudName,
      api_key: this.config.apiKey,
      api_secret: this.config.apiSecret,
      secure: this.config.secure,
    });
    this.logger.log(`Cloudinary configured – cloud: ${this.config.cloudName}`);
  }

  // ── Upload from buffer ──────────────────────────────────────────────────────

  async uploadBuffer(
    buffer: Buffer,
    mimeType: string,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    this.validateMimeType(mimeType);
    this.validateFileSize(buffer.length);

    const resourceType = this.resolveResourceType(mimeType, options.resourceType);

    return new Promise<UploadResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: options.folder ?? this.config.defaultFolder,
          tags: options.tags,
          public_id: options.publicId,
          overwrite: options.overwrite ?? false,
          ...(options.transformation && {
            transformation: this.buildTransformation(options.transformation),
          }),
        },
        (error: UploadApiErrorResponse | undefined, result?: UploadApiResponse) => {
          if (error) {
            this.logger.error(`Upload failed: ${error.message}`);
            return reject(error);
          }
          if (!result) {
            return reject(new Error('Cloudinary returned no result'));
          }
          resolve(this.mapResult(result));
        },
      );

      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }

  // ── Upload from URL ─────────────────────────────────────────────────────────

  async uploadUrl(url: string, options: UploadOptions = {}): Promise<UploadResult> {
    const result = await cloudinary.uploader.upload(url, {
      resource_type: options.resourceType ?? 'auto',
      folder: options.folder ?? this.config.defaultFolder,
      tags: options.tags,
      public_id: options.publicId,
      overwrite: options.overwrite ?? false,
    });

    return this.mapResult(result);
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  async delete(publicId: string, resourceType: 'image' | 'raw' | 'video' = 'image'): Promise<boolean> {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result.result === 'ok';
  }

  // ── Bulk delete by prefix ───────────────────────────────────────────────────

  async deleteByPrefix(prefix: string, resourceType: 'image' | 'raw' | 'video' = 'image'): Promise<number> {
    const result = await cloudinary.api.delete_resources_by_prefix(prefix, {
      type: 'upload',
      resource_type: resourceType,
    });
    const deleted = Object.keys(result.deleted ?? {}).length;
    this.logger.debug(`Deleted ${deleted} resources with prefix "${prefix}"`);
    return deleted;
  }

  // ── Generate signed URL (private resources) ─────────────────────────────────

  generateSignedUrl(publicId: string, expiresInSeconds = 3600): SignedUrlResult {
    const expiresAt = Math.round(Date.now() / 1000) + expiresInSeconds;
    const url = cloudinary.utils.private_download_url(publicId, '', {
      expires_at: expiresAt,
      resource_type: 'image',
      type: 'upload',
    });
    return { url, expiresAt };
  }

  // ── Get resource info ───────────────────────────────────────────────────────

  async getResourceInfo(publicId: string, resourceType: 'image' | 'raw' | 'video' = 'image') {
    return cloudinary.api.resource(publicId, {
      resource_type: resourceType,
    });
  }

  // ── List resources by folder ────────────────────────────────────────────────

  async listResources(
    folder: string,
    maxResults = 30,
  ): Promise<{ resources: Array<{ publicId: string; url: string; format: string; bytes: number }> }> {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder,
      max_results: maxResults,
    });

    return {
      resources: (result.resources ?? []).map((r: { public_id: string; secure_url: string; format: string; bytes: number }) => ({
        publicId: r.public_id,
        url: r.secure_url,
        format: r.format,
        bytes: r.bytes,
      })),
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private validateMimeType(mimeType: string): void {
    const allowed = new Set([...IMAGE_MIMES, ...DOCUMENT_MIMES, ...VIDEO_MIMES]);
    if (!allowed.has(mimeType)) {
      throw new Error(`File type "${mimeType}" is not allowed`);
    }
  }

  private validateFileSize(size: number): void {
    if (size > this.config.maxFileSize) {
      const maxMB = (this.config.maxFileSize / 1048576).toFixed(1);
      throw new Error(`File size exceeds the maximum allowed (${maxMB} MB)`);
    }
    if (size === 0) {
      throw new Error('File is empty');
    }
  }

  private resolveResourceType(
    mimeType: string,
    override?: 'image' | 'raw' | 'video' | 'auto',
  ): 'image' | 'raw' | 'video' | 'auto' {
    if (override) return override;
    if (IMAGE_MIMES.has(mimeType)) return 'image';
    if (VIDEO_MIMES.has(mimeType)) return 'video';
    return 'raw';
  }

  private buildTransformation(t: TransformationOptions): Record<string, unknown>[] {
    const transform: Record<string, unknown> = {};
    if (t.width) transform.width = t.width;
    if (t.height) transform.height = t.height;
    if (t.crop) transform.crop = t.crop;
    if (t.quality) transform.quality = t.quality;
    if (t.format) transform.fetch_format = t.format;
    return [transform];
  }

  private mapResult(result: UploadApiResponse): UploadResult {
    return {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      url: result.url,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      resourceType: result.resource_type,
      createdAt: result.created_at,
    };
  }
}
