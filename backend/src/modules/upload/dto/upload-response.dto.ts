import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({ example: 'https://res.cloudinary.com/.../image/upload/.../abc.jpg' })
  url!: string;

  @ApiProperty({ example: 'st-agnes/rentals/abc' })
  publicId!: string;

  @ApiProperty({ example: 'jpg' })
  format!: string;

  @ApiProperty({ example: 1920 })
  width!: number;

  @ApiProperty({ example: 1080 })
  height!: number;

  @ApiProperty({ example: 284512 })
  bytes!: number;
}

export class DeleteResponseDto {
  @ApiProperty({ example: 'ok' })
  result!: string;

  @ApiProperty({ example: 'st-agnes/rentals/abc' })
  publicId!: string;
}
