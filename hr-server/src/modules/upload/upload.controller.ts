import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  Req,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiConsumes, ApiBearerAuth, ApiOperation, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumberString } from 'class-validator';
import type { FastifyRequest } from 'fastify';
import { CloudinaryService, UploadResult } from './cloudinary.service';

// ── DTOs ──────────────────────────────────────────────────────────────────────

class UploadQueryDto {
  @ApiPropertyOptional({ description: 'Target folder in Cloudinary' })
  @IsOptional()
  @IsString()
  folder?: string;

  @ApiPropertyOptional({ description: 'Comma-separated tags' })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({ description: 'Custom public ID' })
  @IsOptional()
  @IsString()
  publicId?: string;
}

class DeleteByPrefixQueryDto {
  @ApiPropertyOptional({ description: 'Prefix to match for deletion' })
  @IsString()
  prefix!: string;

  @ApiPropertyOptional({ enum: ['image', 'raw', 'video'] })
  @IsOptional()
  @IsString()
  resourceType?: 'image' | 'raw' | 'video';
}

// ── Controller ────────────────────────────────────────────────────────────────

@ApiTags('Upload')
@ApiBearerAuth()
@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly cloudinary: CloudinaryService) {}

  // ── Single file upload ──────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Upload a single file' })
  @ApiConsumes('multipart/form-data')
  async uploadFile(
    @Req() req: FastifyRequest,
    @Query() query: UploadQueryDto,
  ): Promise<UploadResult> {
    const file = await (req as any).file({
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    });

    if (!file) {
      throw new BadRequestException('No file provided. Send a file in the "file" field.');
    }

    const buffer = await file.toBuffer();
    const tags = query.tags ? query.tags.split(',').map((t) => t.trim()) : undefined;

    const result = await this.cloudinary.uploadBuffer(buffer, file.mimetype, {
      folder: query.folder,
      tags,
      publicId: query.publicId,
    });

    this.logger.log(`Uploaded: ${result.publicId} (${result.format}, ${result.bytes} bytes)`);
    return result;
  }

  // ── Multiple files upload (max 5) ──────────────────────────────────────────

  @Post('batch')
  @ApiOperation({ summary: 'Upload multiple files (max 5)' })
  @ApiConsumes('multipart/form-data')
  async uploadBatch(
    @Req() req: FastifyRequest,
    @Query() query: UploadQueryDto,
  ): Promise<UploadResult[]> {
    const parts = (req as any).parts({
      limits: { fileSize: 10 * 1024 * 1024 },
    });

    const results: UploadResult[] = [];
    const tags = query.tags ? query.tags.split(',').map((t) => t.trim()) : undefined;
    let count = 0;

    for await (const part of parts) {
      if (part.type !== 'file') continue;
      if (count >= 5) {
        throw new BadRequestException('Maximum 5 files per batch upload');
      }

      const buffer = await part.toBuffer();
      const result = await this.cloudinary.uploadBuffer(buffer, part.mimetype, {
        folder: query.folder,
        tags,
      });

      results.push(result);
      count++;
    }

    if (results.length === 0) {
      throw new BadRequestException('No files provided');
    }

    this.logger.log(`Batch uploaded: ${results.length} files`);
    return results;
  }

  // ── Upload from URL ─────────────────────────────────────────────────────────

  @Post('url')
  @ApiOperation({ summary: 'Upload a file from a remote URL' })
  async uploadFromUrl(
    @Query('url') url: string,
    @Query() query: UploadQueryDto,
  ): Promise<UploadResult> {
    if (!url) {
      throw new BadRequestException('URL query parameter is required');
    }

    // SSRF protection: only allow https and block private IPs
    this.validateUrl(url);

    const tags = query.tags ? query.tags.split(',').map((t) => t.trim()) : undefined;

    const result = await this.cloudinary.uploadUrl(url, {
      folder: query.folder,
      tags,
      publicId: query.publicId,
    });

    this.logger.log(`Uploaded from URL: ${result.publicId}`);
    return result;
  }

  // ── Delete single file ─────────────────────────────────────────────────────

  @Delete(':publicId')
  @ApiOperation({ summary: 'Delete a file by public ID' })
  async deleteFile(
    @Param('publicId') publicId: string,
    @Query('resourceType') resourceType?: 'image' | 'raw' | 'video',
  ): Promise<{ success: boolean; publicId: string }> {
    const decodedId = decodeURIComponent(publicId);
    const success = await this.cloudinary.delete(decodedId, resourceType);
    return { success, publicId: decodedId };
  }

  // ── Delete by prefix ───────────────────────────────────────────────────────

  @Delete()
  @ApiOperation({ summary: 'Delete all files matching a prefix' })
  async deleteByPrefix(@Query() query: DeleteByPrefixQueryDto): Promise<{ deleted: number }> {
    if (!query.prefix) {
      throw new BadRequestException('prefix query parameter is required');
    }
    const deleted = await this.cloudinary.deleteByPrefix(query.prefix, query.resourceType);
    return { deleted };
  }

  // ── Get resource info ──────────────────────────────────────────────────────

  @Get(':publicId')
  @ApiOperation({ summary: 'Get info about an uploaded resource' })
  async getResourceInfo(
    @Param('publicId') publicId: string,
    @Query('resourceType') resourceType?: 'image' | 'raw' | 'video',
  ) {
    const decodedId = decodeURIComponent(publicId);
    return this.cloudinary.getResourceInfo(decodedId, resourceType);
  }

  // ── List resources by folder ───────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List resources in a folder' })
  async listResources(
    @Query('folder') folder?: string,
    @Query('maxResults') maxResults?: number,
  ) {
    const targetFolder = folder || 'hr-system';
    return this.cloudinary.listResources(targetFolder, maxResults ?? 30);
  }

  // ── Generate signed URL ────────────────────────────────────────────────────

  @Get(':publicId/signed-url')
  @ApiOperation({ summary: 'Generate a time-limited signed URL for a private resource' })
  async getSignedUrl(
    @Param('publicId') publicId: string,
    @Query('expiresIn') expiresIn?: number,
  ) {
    const decodedId = decodeURIComponent(publicId);
    return this.cloudinary.generateSignedUrl(decodedId, expiresIn ?? 3600);
  }

  // ── URL Validation (SSRF protection) ────────────────────────────────────────

  private validateUrl(url: string): void {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new BadRequestException('Invalid URL format');
    }

    // Only allow HTTPS
    if (parsed.protocol !== 'https:') {
      throw new BadRequestException('Only HTTPS URLs are allowed');
    }

    // Block private/reserved IP ranges and localhost
    const hostname = parsed.hostname.toLowerCase();
    const blockedPatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^0\.0\.0\.0$/,
      /^::1$/,
      /^fc00:/i,
      /^fe80:/i,
    ];

    for (const pattern of blockedPatterns) {
      if (pattern.test(hostname)) {
        throw new BadRequestException('URLs pointing to private or reserved addresses are not allowed');
      }
    }
  }
}
