import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsMongoId,
  IsIn,
} from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'New Website' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'A project to build a new website', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Set automatically from authenticated user',
  })
  @IsOptional()
  @IsMongoId()
  owner: string;

  @ApiProperty({
    example: ['frontend', 'urgent'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ example: 'todo', enum: ['todo', 'in-progress', 'done'] })
  @IsString()
  @IsIn(['todo', 'in-progress', 'done'])
  status: string;
}
