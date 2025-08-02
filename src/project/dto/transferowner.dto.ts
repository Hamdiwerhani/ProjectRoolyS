import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class TransferOwnerDto {
    @ApiProperty({ example: '688ce178d40e53ca60e5471e' })
    @IsMongoId()
    newOwnerId: string;
}
