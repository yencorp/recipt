import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getApiInfo() {
    return {
      message: '광남동성당 예결산 관리 시스템 API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      docs: process.env.ENABLE_SWAGGER === 'true' 
        ? `http://localhost:${process.env.PORT || 8000}/${process.env.SWAGGER_PATH || 'api/docs'}`
        : null,
    };
  }
}