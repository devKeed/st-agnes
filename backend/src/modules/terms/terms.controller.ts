import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { CurrentUser, Public, Roles } from '../../common/decorators';
import { TermsService } from './terms.service';
import { CreateTermsDto } from './dto';

@ApiTags('Terms')
@Controller('terms')
export class TermsController {
  constructor(private readonly termsService: TermsService) {}

  @Public()
  @Get('active')
  @ApiOperation({ summary: 'Get the currently active terms version (public)' })
  getActive() {
    return this.termsService.getActive();
  }

  @Get()
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all terms versions (admin)' })
  listAll() {
    return this.termsService.listAll();
  }

  @Post()
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Create a new terms version (admin). Pass activate=true to make it the live version immediately.',
  })
  create(@Body() dto: CreateTermsDto, @CurrentUser('id') userId: string) {
    return this.termsService.create(dto, userId);
  }

  @Patch(':id/activate')
  @HttpCode(HttpStatus.OK)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Activate a specific terms version (admin). Deactivates any other active version.',
  })
  activate(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.termsService.activate(id);
  }
}
