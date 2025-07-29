import { IsEmail, IsNotEmpty, IsString, MinLength, IsIn } from 'class-validator';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    @IsIn(['user', 'admin'])
    role: string;
}

export class UpdateUserDto {
    @IsString()
    name?: string;

    @IsEmail()
    email?: string;

    @IsString()
    password?: string;

    @IsString()
    @IsIn(['user', 'admin'])
    role?: string;
}
