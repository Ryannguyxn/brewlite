import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health check / root endpoint' })
  @ApiResponse({ 
    status: 200,
    description: 'BrewLite backend is running',
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
