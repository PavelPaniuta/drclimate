import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    if (dto.role === Role.ADMIN) {
      throw new ConflictException('Admin registration is not allowed');
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        role: dto.role,
        name: dto.name,
        phone: dto.phone,
        address: dto.address,
        telegram: dto.telegram,
        city: dto.city,
        ...(dto.role === Role.MASTER && dto.city
          ? {
              masterProfile: {
                create: {
                  serviceArea: dto.city,
                  skills: [],
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        city: true,
      },
    });

    this.logger.log(`User registered: ${user.email} (${user.role})`);
    return { user, accessToken: this.signToken(user.id, user.email, user.role) };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || user.isBanned) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        city: user.city,
      },
      accessToken: this.signToken(user.id, user.email, user.role),
    };
  }

  private signToken(sub: string, email: string, role: Role) {
    return this.jwt.sign(
      { sub, email, role },
      { secret: this.config.get('JWT_SECRET'), expiresIn: this.config.get('JWT_EXPIRES_IN', '7d') },
    );
  }
}
