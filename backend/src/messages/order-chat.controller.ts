import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { MessagesService } from './messages.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class OrderChatController {
  constructor(private messagesService: MessagesService) {}

  @Get('orders/chat/unread')
  @Roles(Role.CLIENT)
  clientUnread(@CurrentUser() user: JwtPayload) {
    return this.messagesService.getClientUnreadSummary(user.sub);
  }

  @Get('masters/orders/chat/unread')
  @Roles(Role.MASTER)
  masterUnread(@CurrentUser() user: JwtPayload) {
    return this.messagesService.getMasterUnreadSummary(user.sub);
  }
}
