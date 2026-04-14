import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PolicyType } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreatePolicyVersionDto } from './dto/create-policy-version.dto';
import { PoliciesService } from './policies.service';

@Controller('api/v1/policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get('active')
  getActive() {
    return this.policiesService.getActiveVersions();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@Query('type') type: PolicyType) {
    return this.policiesService.listVersions(type);
  }

  @Post('versions')
  @UseGuards(JwtAuthGuard)
  createVersion(@Body() dto: CreatePolicyVersionDto) {
    return this.policiesService.createVersion(dto);
  }

  @Patch('versions/:id/activate')
  @UseGuards(JwtAuthGuard)
  activate(@Param('id') id: string) {
    return this.policiesService.activateVersion(id);
  }
}
