import { Injectable, Logger } from '@nestjs/common';
import { UploadResponseDto } from './dto';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as qiniu from 'qiniu';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly storageType = process.env.STORAGE_TYPE || 'LOCAL';
  private readonly localUploadDir = process.env.LOCAL_UPLOAD_DIR || 'uploads';
  private readonly appUrl = process.env.APP_URL || 'http://localhost:3000';

  private s3Client!: S3Client;
  private qiniuMac!: qiniu.auth.digest.Mac;

  constructor() {
    this.initStorage();
  }

  private initStorage() {
    if (this.storageType === 'S3') {
      this.s3Client = new S3Client({
        region: process.env.S3_REGION || 'us-east-1',
        endpoint: process.env.S3_ENDPOINT,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY || '',
          secretAccessKey: process.env.S3_SECRET_KEY || '',
        },
        forcePathStyle: true, // For MinIO compatibility
      });
    } else if (this.storageType === 'QINIU') {
      this.qiniuMac = new qiniu.auth.digest.Mac(
        process.env.QINIU_ACCESS_KEY,
        process.env.QINIU_SECRET_KEY,
      );
    } else {
      // Ensure local upload directory exists
      fs.ensureDirSync(this.localUploadDir);
    }
  }

  async uploadFile(file: Express.Multer.File, userId?: string): Promise<UploadResponseDto> {
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    // Optional: organize by userId or date
    const key = userId ? `${userId}/${fileName}` : fileName;

    if (this.storageType === 'S3') {
      return this.uploadS3(file, key);
    } else if (this.storageType === 'QINIU') {
      return this.uploadQiniu(file, key);
    } else {
      return this.uploadLocal(file, key);
    }
  }

  private async uploadLocal(file: Express.Multer.File, key: string): Promise<UploadResponseDto> {
    const filePath = path.join(this.localUploadDir, key);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, file.buffer);

    const url = `${this.appUrl}/uploads/${key}`;
    return {
      url,
      name: file.originalname,
      type: file.mimetype,
      size: file.size,
    };
  }

  private async uploadS3(file: Express.Multer.File, key: string): Promise<UploadResponseDto> {
    const bucket = process.env.S3_BUCKET;
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read', // Assuming public access for simplicity
    });

    await this.s3Client.send(command);

    // Construct URL. If endpoint is custom (e.g. MinIO), use it. Otherwise standard AWS URL.
    let url = '';
    const endpoint = process.env.S3_ENDPOINT;
    if (endpoint) {
        // MinIO / Custom S3 style: http://endpoint/bucket/key
        url = `${endpoint}/${bucket}/${key}`;
    } else {
        // AWS style: https://bucket.s3.region.amazonaws.com/key
        url = `https://${bucket}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
    }

    // Allow override public domain
    if (process.env.S3_PUBLIC_DOMAIN) {
        url = `${process.env.S3_PUBLIC_DOMAIN}/${key}`;
    }

    return {
      url,
      name: file.originalname,
      type: file.mimetype,
      size: file.size,
    };
  }

  private async uploadQiniu(file: Express.Multer.File, key: string): Promise<UploadResponseDto> {
    const bucket = process.env.QINIU_BUCKET;
    const putPolicy = new qiniu.rs.PutPolicy({ scope: `${bucket}:${key}` });
    const uploadToken = putPolicy.uploadToken(this.qiniuMac);
    const config = new qiniu.conf.Config();
    const formUploader = new qiniu.form_up.FormUploader(config);
    const putExtra = new qiniu.form_up.PutExtra();

    return new Promise((resolve, reject) => {
      formUploader.put(uploadToken, key, file.buffer, putExtra, (respErr, respBody, respInfo) => {
        if (respErr) {
          reject(respErr);
          return;
        }
        if (respInfo.statusCode == 200) {
          const domain = process.env.QINIU_DOMAIN;
          const url = `${domain}/${key}`;
          resolve({
            url,
            name: file.originalname,
            type: file.mimetype,
            size: file.size,
          });
        } else {
          reject(new Error(`Qiniu upload failed: ${respInfo.statusCode} ${respBody}`));
        }
      });
    });
  }
}
