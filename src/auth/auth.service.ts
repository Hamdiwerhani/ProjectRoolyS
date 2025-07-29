/* eslint-disable prettier/prettier */
import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { User, UserDocument } from 'src/schemas/user.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>, private configService: ConfigService,) { }

    async signup(email: string, password: string) {
        try {
            const hashedPassword = await bcrypt.hash(password, this.configService.get<string>('BCRYPT_SALT'));
            const user = new this.userModel({ email, password: hashedPassword });
            await user.save();
            return { message: 'User registered successfully' };
        } catch (error) {
            throw new InternalServerErrorException('Signup failed');
        }
    }

    async login(email: string, password: string) {
        try {
            const user = await this.userModel.findOne({ email });
            const isPasswordMatch = user && await bcrypt.compare(password, user.password);

            if (!user || !isPasswordMatch) {
                throw new UnauthorizedException('Invalid credentials');
            }

            const payload = { sub: user._id, email: user.email, role: user.role };
            const token = jwt.sign(payload, this.configService.get<string>('JWT_SECRET') || 'SECRET_KEY', {
                expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
            });

            return {
                token,
                user: { userId: user.id, email: user.email, role: user.role },
            };
        } catch (error) {
            throw error instanceof UnauthorizedException ? error : new InternalServerErrorException('Login failed');
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
            throw new InternalServerErrorException('Error fetching user');
        }
    }

}
