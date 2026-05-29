import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { MasterChatService } from './master-chat.service';
import { SendMasterChatDto } from './dto/master-chat.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class MasterChatController {
  constructor(private masterChatService: MasterChatService) {}

  @Get('admin/chat/unread')
  @Roles(Role.ADMIN)
  adminUnreadSummary() {
    return this.masterChatService.getAdminUnreadSummary();
  }

  @Get('admin/masters')
  @Roles(Role.ADMIN)
  listMasters() {
    return this.masterChatService.listMastersForAdmin();
  }

  @Patch('admin/masters/:masterId/chat/read')
  @Roles(Role.ADMIN)
  markAdminRead(@Param('masterId') masterId: string) {
    return this.masterChatService.markAdminRead(masterId);
  }

  @Get('admin/masters/:masterId/chat')
  @Roles(Role.ADMIN)
  getMessagesAsAdmin(@Param('masterId') masterId: string, @CurrentUser() user: JwtPayload) {
    return this.masterChatService.getMessages(masterId, user.sub, Role.ADMIN);
  }

  @Post('admin/masters/:masterId/chat')
  @Roles(Role.ADMIN)
  sendAsAdmin(
    @Param('masterId') masterId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: SendMasterChatDto,
  ) {
    return this.masterChatService.sendMessage(masterId, user.sub, Role.ADMIN, dto);
  }

  @Get('masters/admin-chat/unread')
  @Roles(Role.MASTER)
  masterUnread(@CurrentUser() user: JwtPayload) {
    return this.masterChatService.getMasterUnreadCount(user.sub).then((count) => ({ count }));
  }

  @Get('masters/admin-chat')
  @Roles(Role.MASTER)
  getMessagesAsMaster(@CurrentUser() user: JwtPayload) {
    return this.masterChatService.getMessages(user.sub, user.sub, Role.MASTER);
  }

  @Patch('masters/admin-chat/read')
  @Roles(Role.MASTER)
  markMasterRead(@CurrentUser() user: JwtPayload) {
    return this.masterChatService.markMasterRead(user.sub);
  }

  @Post('masters/admin-chat')
  @Roles(Role.MASTER)
  sendAsMaster(@CurrentUser() user: JwtPayload, @Body() dto: SendMasterChatDto) {
    return this.masterChatService.sendMessage(user.sub, user.sub, Role.MASTER, dto);
  }
}
