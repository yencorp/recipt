import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ 
    summary: 'API 루트 엔드포인트',
    description: 'API 서버의 기본 정보를 반환합니다.'
  })
  @ApiResponse({ 
    status: 200, 
    description: '성공적으로 정보를 반환했습니다.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '광남동성당 예결산 관리 시스템 API' },
        version: { type: 'string', example: '1.0.0' },
        environment: { type: 'string', example: 'development' },
        timestamp: { type: 'string', example: '2025-09-07T07:15:30.000Z' }
      }
    }
  })
  getRoot() {
    return this.appService.getApiInfo();
  }
}