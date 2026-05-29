import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, ScheduleOrderDto, UpdateMasterNotesDto, CreateOrderCommentDto, CompleteOrderDto } from './dto/order.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('orders')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get('my')
  @Roles(Role.CLIENT)
  myOrders(@CurrentUser() user: JwtPayload) {
    return this.ordersService.findForClient(user.sub);
  }

  @Get('available')
  @Roles(Role.MASTER)
  available(@CurrentUser() user: JwtPayload) {
    return this.ordersService.findAvailableForMaster(user.sub);
  }

  @Get('assigned')
  @Roles(Role.MASTER)
  assigned(@CurrentUser() user: JwtPayload) {
    return this.ordersService.findAssignedForMaster(user.sub);
  }

  @Get(':id/comments')
  getComments(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.ordersService.getComments(id, user.sub, user.role as Role);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.ordersService.findOne(id, user.sub, user.role as Role);
  }

  @Post(':id/accept')
  @Roles(Role.MASTER)
  accept(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.ordersService.accept(id, user.sub);
  }

  @Patch(':id/schedule')
  @Roles(Role.MASTER)
  schedule(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ScheduleOrderDto,
  ) {
    return this.ordersService.scheduleOrder(id, user.sub, dto);
  }

  @Post(':id/decline')
  @Roles(Role.MASTER)
  decline(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.ordersService.decline(id, user.sub);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, user.sub, user.role as Role, dto);
  }

  @Post(':id/complete')
  @Roles(Role.MASTER)
  complete(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CompleteOrderDto,
  ) {
    return this.ordersService.completeOrder(id, user.sub, dto);
  }

  @Patch(':id/master-notes')
  @Roles(Role.MASTER)
  updateMasterNotes(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateMasterNotesDto,
  ) {
    return this.ordersService.updateMasterNotes(id, user.sub, dto);
  }

  @Post(':id/comments')
  addComment(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateOrderCommentDto,
  ) {
    return this.ordersService.addComment(id, user.sub, user.role as Role, dto);
  }
}
