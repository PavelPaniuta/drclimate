import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCityDto, UpdateCityDto } from './dto/city.dto';

@Injectable()
export class CitiesService {
  constructor(private prisma: PrismaService) {}

  findAll(includeInactive = false) {
    return this.prisma.city.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { nameUk: 'asc' }],
    });
  }

  async create(dto: CreateCityDto) {
    const existing = await this.prisma.city.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('City slug already exists');

    return this.prisma.city.create({
      data: {
        slug: dto.slug,
        nameUk: dto.nameUk,
        nameRu: dto.nameRu,
        nameEn: dto.nameEn,
        sortOrder: dto.sortOrder ?? 100,
      },
    });
  }

  async update(slug: string, dto: UpdateCityDto) {
    const city = await this.prisma.city.findUnique({ where: { slug } });
    if (!city) throw new NotFoundException('City not found');

    return this.prisma.city.update({
      where: { slug },
      data: {
        ...(dto.nameUk !== undefined ? { nameUk: dto.nameUk } : {}),
        ...(dto.nameRu !== undefined ? { nameRu: dto.nameRu } : {}),
        ...(dto.nameEn !== undefined ? { nameEn: dto.nameEn } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async ensureExists(slug: string) {
    const city = await this.prisma.city.findUnique({ where: { slug } });
    if (!city || !city.isActive) {
      throw new ConflictException('Invalid city');
    }
    return city;
  }
}
