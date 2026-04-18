import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { Public, Roles } from '../../common/decorators';
import { GalleryService } from './gallery.service';
import {
  CreateGalleryDto,
  QueryGalleryDto,
  ReorderGalleryDto,
  UpdateGalleryDto,
} from './dto';

@ApiTags('Gallery')
@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'List visible gallery items, optionally filtered by category (public)',
  })
  async listPublic(@Query() query: QueryGalleryDto) {
    return this.galleryService.findAll(query, { isAdmin: false });
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single gallery item by id (public)' })
  async getPublic(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.galleryService.findOne(id, { isAdmin: false });
  }

  @Get('admin/list')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Admin list — supports includeHidden=true to surface hidden items.',
  })
  async listAdmin(@Query() query: QueryGalleryDto) {
    return this.galleryService.findAll(query, { isAdmin: true });
  }

  @Post()
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create gallery item (admin)' })
  async create(@Body() dto: CreateGalleryDto) {
    return this.galleryService.create(dto);
  }

  @Patch('reorder')
  @HttpCode(HttpStatus.OK)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Bulk-update sort order (admin). All ids must exist; duplicates rejected.',
  })
  async reorder(@Body() dto: ReorderGalleryDto) {
    return this.galleryService.reorder(dto);
  }

  @Put(':id')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update gallery item (admin)' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateGalleryDto,
  ) {
    return this.galleryService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Delete gallery item (admin) — also removes the Cloudinary asset best-effort.',
  })
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.galleryService.remove(id);
  }
}
