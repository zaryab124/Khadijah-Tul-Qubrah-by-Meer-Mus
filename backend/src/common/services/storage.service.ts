import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface PresignedUrlResult {
  uploadUrl: string;
  storageKey: string;
  thumbnailKey: string;
  expiresInSeconds: number;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ];
  private readonly maxFileSizeBytes = 25 * 1024 * 1024; // 25 MB

  constructor(private readonly configService: ConfigService) {}

  validateFile(mimeType: string, fileSizeBytes?: number) {
    if (!this.allowedMimeTypes.includes(mimeType.toLowerCase())) {
      throw new BadRequestException(
        `Invalid file format "${mimeType}". Allowed formats: JPEG, PNG, WEBP, PDF.`,
      );
    }

    if (fileSizeBytes && fileSizeBytes > this.maxFileSizeBytes) {
      throw new BadRequestException(
        `File size exceeds maximum permitted limit of 25MB (${(
          fileSizeBytes /
          (1024 * 1024)
        ).toFixed(2)}MB uploaded).`,
      );
    }
  }

  generateStorageKeys(folder: string, originalFileName: string) {
    const ext = originalFileName.includes('.')
      ? originalFileName.substring(originalFileName.lastIndexOf('.'))
      : '.jpg';
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const storageKey = `${folder}/${uniqueId}${ext}`;
    const thumbnailKey = `${folder}/thumbnails/${uniqueId}_thumb.webp`;

    return { storageKey, thumbnailKey };
  }

  getSignedDownloadUrl(storageKey: string, expiresInSeconds = 900): string {
    const endpoint = this.configService.get<string>(
      'S3_ENDPOINT',
      'https://storage.khadijatulqubrah.com',
    );
    const bucket = this.configService.get<string>(
      'S3_BUCKET_NAME',
      'khadijatulqubrah-media',
    );
    const secret = this.configService.get<string>('JWT_SECRET', 'secret');

    const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${storageKey}:${expires}`)
      .digest('hex');

    return `${endpoint}/${bucket}/${storageKey}?expires=${expires}&sig=${signature}`;
  }

  getSignedThumbnailUrl(thumbnailKey: string, expiresInSeconds = 900): string {
    return this.getSignedDownloadUrl(thumbnailKey, expiresInSeconds);
  }

  getPresignedUploadUrl(
    folder: string,
    originalFileName: string,
    mimeType: string,
    fileSizeBytes?: number,
  ): PresignedUrlResult {
    this.validateFile(mimeType, fileSizeBytes);

    const { storageKey, thumbnailKey } = this.generateStorageKeys(folder, originalFileName);
    const endpoint = this.configService.get<string>(
      'S3_ENDPOINT',
      'https://storage.khadijatulqubrah.com',
    );
    const bucket = this.configService.get<string>(
      'S3_BUCKET_NAME',
      'khadijatulqubrah-media',
    );
    const secret = this.configService.get<string>('JWT_SECRET', 'secret');

    const expiresInSeconds = 900;
    const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`PUT:${storageKey}:${expires}`)
      .digest('hex');

    const uploadUrl = `${endpoint}/${bucket}/${storageKey}?expires=${expires}&sig=${signature}`;

    return {
      uploadUrl,
      storageKey,
      thumbnailKey,
      expiresInSeconds,
    };
  }
}
