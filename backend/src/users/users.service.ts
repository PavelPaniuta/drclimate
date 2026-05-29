import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { userContactSelect } from '../common/prisma-selects';
import { UpdateUserProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        ...userContactSelect,
        role: true,
        isBanned: true,
        createdAt: true,
        masterProfile: {
          select: {
            id: true,
            avatarUrl: true,
            bio: true,
            serviceArea: true,
            workPhotos: {
              orderBy: { sortOrder: 'asc' },
              select: { id: true, url: true, caption: true, sortOrder: true },
            },
          },
        },
      },
    });
  }

  async updateProfile(userId: string, dto: UpdateUserProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        phone: dto.phone,
        address: dto.address,
        telegram: dto.telegram,
      },
      select: {
        ...userContactSelect,
        role: true,
      },
    });
  }
}
