import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Sign up a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @Post('signup')
  signup(@Body() registerDto: RegisterDto) {
    return this.authService.signup(
      registerDto.name,
      registerDto.email,
      registerDto.password,
    );
  }

  @ApiOperation({ summary: 'Login and receive JWT' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'User profile info' })
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getProfile(@Request() req) {
    const userId = req.user.userId;
    const user = await this.authService.findById(userId);
    return {
      message: 'User profile info',
      user,
    };
  }
}
