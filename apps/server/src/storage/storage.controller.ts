import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../common/user.decorator';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtUser,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    // Fix encoding for non-ASCII filenames (e.g. Chinese characters)
    // Multer/Busboy might parse filename as latin1 by default
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');

    return this.storageService.uploadFile(file, user.sub);
  }
}
