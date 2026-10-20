import { Controller, Get, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// GET /api/health: quick check that the API is up and can reach the database.
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'connected' };
    } catch (error) {
      this.logger.error(`Database unreachable: ${(error as Error).message}`);
      throw new ServiceUnavailableException({ status: 'error', database: 'unreachable' });
    }
  }
}
