import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { existsSync } from 'fs';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private uploads: UploadsService) {}

  @Get('files/:filename')
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    const path = this.uploads.getFilePath(filename);
    if (!existsSync(path)) {
      throw new NotFoundException('File not found');
    }
    return res.sendFile(path);
  }
}
