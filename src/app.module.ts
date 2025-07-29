import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [MongooseModule.forRoot(process.env.MONGO_URI || "mongodb://localhost:27017/projectRoolyS"), AuthModule, UsersModule,],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
