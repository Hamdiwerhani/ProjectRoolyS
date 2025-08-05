import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsArray, ArrayNotEmpty, IsString } from 'class-validator';

export class updateShareProjectDto {
    @ApiProperty({ example: '688ce178d40e53ca60e5471e' })
    @IsMongoId()
    userId: string;

    @ApiProperty({ example: ['view', 'edit'], type: [String] })
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    permissions: string[];
}
