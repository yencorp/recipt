import { Module, Global } from '@nestjs/common';
import { DatabaseService } from './database.service';

/**
 * 데이터베이스 모듈
 * 데이터베이스 관련 서비스를 제공하는 글로벌 모듈
 */
@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}