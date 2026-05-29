import { Controller, Get, Patch, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminCreateOrderDto } from '../orders/dto/order.dto';

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
  createOrder(@Body() dto: AdminCreateOrderDto) {
    return this.adminService.createOrder(dto);
  }

  @Patch('users/:id/ban')
  banUser(@Param('id') id: string, @Body('isBanned') isBanned: boolean) {
    return this.adminService.banUser(id, isBanned);
  }

}
