import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { SectorsModule } from './sectors/sectors.module';
import { ReservationsModule } from './reservations/reservations.module';
import { WaitlistModule } from './waitlist/waitlist.module';

@Module({
  imports: [PrismaModule, SectorsModule, ReservationsModule, WaitlistModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
