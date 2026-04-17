import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './common/decorators';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check' })
  getHello() {
    return {
      status: 'ok',
      service: 'st-agnes-backend',
      message: this.appService.getHello(),
      timestamp: new Date().toISOString(),
    };
  }
}
