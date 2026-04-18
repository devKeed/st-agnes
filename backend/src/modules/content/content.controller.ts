import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { CurrentUser, Public, Roles } from '../../common/decorators';
import { ContentService } from './content.service';
import { UpsertContentDto } from './dto';

@ApiTags('Content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all site content rows (public)' })
  list() {
    return this.contentService.findAll();
  }

  @Public()
  @Get(':key')
  @ApiOperation({ summary: 'Get a single content row by pageKey (public)' })
  get(@Param('key') key: string) {
    return this.contentService.findOne(key);
  }

  @Put(':key')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Upsert a content row (admin). Creates the key if missing.',
  })
  upsert(
    @Param('key') key: string,
    @Body() dto: UpsertContentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.contentService.upsert(key, dto, userId);
  }
}
