import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/message.dto';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('orders/:orderId/messages')
@UseGuards(AuthGuard('jwt'))
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get()
  findAll(@Param('orderId') orderId: string, @CurrentUser() user: JwtPayload) {
    return this.messagesService.findByOrder(orderId, user.sub, user.role as Role);
  }

  @Post()
  send(
    @Param('orderId') orderId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messagesService.send(orderId, user.sub, user.role as Role, dto);
  }
}
