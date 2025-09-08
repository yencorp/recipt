import { DataSourceOptions } from 'typeorm';
import { getDatabaseConfig } from './src/config/database.config';

/**
 * TypeORM CLI 설정 파일
 * 마이그레이션 생성 및 실행에 사용
 */
const config: DataSourceOptions = getDatabaseConfig();

export default config;