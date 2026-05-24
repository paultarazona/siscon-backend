import { Role } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
export class RegisterDto { @IsString() nombres: string; @IsString() apellidos: string; @IsEmail() email: string; @IsString() @MinLength(6) password: string; @IsOptional() @IsEnum(Role) rol?: Role; }
