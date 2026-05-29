import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { MastersService } from './masters.service';
import { UpdateMasterProfileDto, UpdateMasterWorkSettingsDto, UpdateAvailabilityDto } from './dto/master.dto';
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
