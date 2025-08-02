import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsArray, ArrayNotEmpty, IsString } from 'class-validator';

export class ShareProjectDto {
  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  @IsMongoId()
  projectId: string;

  @ApiProperty({ example: '688ce178d40e53ca60e5471e' })
  @IsMongoId()
  userId: string;

  @ApiProperty({ example: ['view', 'edit'], type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissions: string[];
}
