import { Controller, Get, Patch, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminCreateOrderDto, AdminUpdateOrderDto } from '../orders/dto/order.dto';
import { AdminUpdateUserDto } from './dto/admin-user.dto';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  getUsers() {
    return this.adminService.getUsers();
  }

  @Get('orders')
  getOrders() {
    return this.adminService.getOrders();
  }

  @Post('orders')
  createOrder(@Body() dto: AdminCreateOrderDto, @CurrentUser() user: JwtPayload) {
    return this.adminService.createOrder(dto, user.sub);
  }

  @Patch('orders/:id')
  updateOrder(
    @Param('id') id: string,
    @Body() dto: AdminUpdateOrderDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.updateOrder(id, user.sub, dto);
  }

  @Get('orders/:id/audit')
  getOrderAudit(@Param('id') id: string) {
    return this.adminService.getOrderAudit(id);
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    return this.adminService.updateUser(id, dto);
  }

  @Patch('users/:id/ban')
  banUser(@Param('id') id: string, @Body('isBanned') isBanned: boolean) {
    return this.adminService.banUser(id, isBanned);
  }

}
