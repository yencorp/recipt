import { Module, Global } from "@nestjs/common";
import { APP_PIPE } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";

@Global()
@Module({
  providers: [
    // 글로벌 Validation Pipe 등록
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    // TODO: 추가 글로벌 프로바이더들
    // {
    //   provide: APP_FILTER,
    //   useClass: HttpExceptionFilter,
    // },
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: LoggingInterceptor,
    // },
  ],
  exports: [],
})
export class CommonModule {}
