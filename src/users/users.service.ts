import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from 'src/schemas/user.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const saltRounds = parseInt(
        this.configService.get<string>('BCRYPT_SALT') || '10',
        10,
      );

      const hashedPassword = await bcrypt.hash(
        createUserDto.password,
        saltRounds,
      );
      const createdUser = new this.userModel({
        ...createUserDto,
        password: hashedPassword,
      });
      return await createdUser.save();
    } catch (error) {
      console.error('Create User Error:', error);
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async findAll(): Promise<User[]> {
    try {
      return await this.userModel.find().select('-password');
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async findByInfo(id: string): Promise<User> {
    try {
      const user = await this.userModel.findById(id).select('-password');
      if (!user) throw new NotFoundException('User not found');
      return user;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to find user');
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      const saltRounds = parseInt(
        this.configService.get<string>('BCRYPT_SALT') || '10',
        10,
      );
      if (updateUserDto.password) {
        updateUserDto.password = await bcrypt.hash(
          updateUserDto.password,
          saltRounds,
        );
      }
      const user = await this.userModel.findByIdAndUpdate(id, updateUserDto, {
        new: true,
      });
      if (!user) throw new NotFoundException('User not found');
      return user;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to update user');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.userModel.findByIdAndDelete(id);
      if (!result) throw new NotFoundException('User not found');
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to delete user');
    }
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id).select('-password');
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
