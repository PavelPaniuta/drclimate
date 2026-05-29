import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

const imageUpload = { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } };
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { MastersService } from './masters.service';
import {
  UpdateMasterProfileDto,
  UpdateMasterWorkSettingsDto,
  UpdateAvailabilityDto,
} from './dto/master.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('masters')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.MASTER)
export class MastersController {
  constructor(private mastersService: MastersService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.mastersService.getProfile(user.sub);
  }

  @Patch('profile')
  updateProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateMasterProfileDto) {
    return this.mastersService.updateProfile(user.sub, dto);
  }

  @Post('profile/avatar')
  @UseInterceptors(FileInterceptor('file', imageUpload))
  uploadAvatar(@CurrentUser() user: JwtPayload, @UploadedFile() file: Express.Multer.File) {
    return this.mastersService.uploadAvatar(user.sub, file);
  }

  @Post('profile/work-photos')
  @UseInterceptors(FileInterceptor('file', imageUpload))
  addWorkPhoto(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
    @Body('caption') caption?: string,
  ) {
    return this.mastersService.addWorkPhoto(user.sub, file, caption);
  }

  @Delete('profile/work-photos/:photoId')
  deleteWorkPhoto(@CurrentUser() user: JwtPayload, @Param('photoId') photoId: string) {
    return this.mastersService.deleteWorkPhoto(user.sub, photoId);
  }

  @Patch('availability')
  setAvailability(@CurrentUser() user: JwtPayload, @Body() dto: UpdateAvailabilityDto) {
    return this.mastersService.setAvailability(user.sub, dto);
  }

  @Get('workboard')
  getWorkboard(@CurrentUser() user: JwtPayload) {
    return this.mastersService.getWorkboard(user.sub);
  }

  @Patch('work-settings')
  updateWorkSettings(@CurrentUser() user: JwtPayload, @Body() dto: UpdateMasterWorkSettingsDto) {
    return this.mastersService.updateWorkSettings(user.sub, dto);
  }

  @Get('earnings')
  getEarnings(@CurrentUser() user: JwtPayload) {
    return this.mastersService.getEarnings(user.sub);
  }
}
