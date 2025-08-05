import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { User, UserDocument } from 'src/schemas/user.schema';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  LoginResponse,
  SignupResponse,
} from 'src/types/auth-response.interface';

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

  async signup(registerDto: RegisterDto): Promise<SignupResponse> {
    try {
      const existingUser = await this.userModel.findOne({
        email: registerDto.email,
      });
      if (existingUser) {
        throw new UnauthorizedException('Email already exists');
      }
      const saltRounds = parseInt(process.env.BCRYPT_SALT || '10', 10);

      const hashedPassword = (await bcrypt.hash(
        registerDto.password,
        saltRounds,
      )) as string;

      const user = new this.userModel({
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
        role: 'admin',
      });
      await user.save();
      return { message: 'User registered successfully' };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Signup failed');
    }
  }

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    try {
      const user: UserDocument | null = await this.userModel.findOne({
        email: loginDto.email,
      });
      const isPasswordMatch =
        user &&
        ((await bcrypt.compare(loginDto.password, user.password)) as boolean);

      if (!user || !isPasswordMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload = { sub: user._id, email: user.email, role: user.role };
      const token = jwt.sign(payload, process.env.JWT_SECRET || 'SECRET_KEY', {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });

      return {
        token,
        user: {
          userId: (user._id as Types.ObjectId).toString(),
          email: user.email,
          role: user.role,
        },
      };
    } catch (error: unknown) {
      throw error instanceof UnauthorizedException
        ? error
        : new InternalServerErrorException('Login failed');
    }
  }
  async findById(id: string): Promise<User> {
    try {
      if (!isValidObjectId(id)) {
        throw new NotFoundException('Invalid user ID');
      }
      const user = await this.userModel.findById(id).select('-password');
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      console.log(error);

      throw new InternalServerErrorException(
        `Failed to create project: ${error instanceof Error ? error.message : ''}`,
      );
    }
  }
}
