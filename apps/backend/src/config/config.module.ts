import { Module, Global } from "@nestjs/common";
import {
  ConfigModule as NestConfigModule,
  ConfigService,
} from "@nestjs/config";
import { join } from "path";

// 환경별 설정 파일 로더
const getEnvFilePaths = () => {
  const nodeEnv = process.env.NODE_ENV || "development";
  const rootPath = process.cwd();

  return [join(rootPath, `.env.${nodeEnv}`), join(rootPath, ".env")];
};

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: getEnvFilePaths(),
      cache: true,
      expandVariables: true,
      validationSchema: null, // TODO: Joi 스키마 추가
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
