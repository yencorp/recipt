import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 글로벌 프리픽스 설정
  app.setGlobalPrefix(process.env.API_PREFIX || 'api');

  // CORS 설정
  if (process.env.ENABLE_CORS === 'true') {
    app.enableCors({
      origin: process.env.CORS_ORIGIN?.split(',') || '*',
      credentials: process.env.CORS_CREDENTIALS === 'true',
    });
  }

  // 글로벌 파이프 설정 (유효성 검사)
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger 설정 (개발환경)
  if (process.env.ENABLE_SWAGGER === 'true') {
    const config = new DocumentBuilder()
      .setTitle('광남동성당 예결산 관리 시스템 API')
      .setDescription('청소년위원회 예결산 관리 시스템의 REST API 문서')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT 토큰을 입력하세요',
        },
        'JWT',
      )
      .addTag('auth', '인증 관리')
      .addTag('users', '사용자 관리')
      .addTag('organizations', '단체 관리')
      .addTag('projects', '행사(프로젝트) 관리')
      .addTag('budgets', '예산 관리')
      .addTag('settlements', '결산 관리')
      .addTag('receipts', '영수증 관리')
      .addTag('documents', '문서 생성')
      .addTag('blog', '블로그')
      .addTag('health', '헬스체크')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(
      process.env.SWAGGER_PATH || 'api/docs',
      app,
      document,
      {
        customSiteTitle: '예결산 관리 API',
        customCss: `
          .topbar-wrapper img { content: url('/favicon.ico'); width: 40px; height: auto; }
          .swagger-ui .topbar { background-color: #3b82f6; }
        `,
      },
    );

    console.log(
      `📚 Swagger UI: http://localhost:${process.env.PORT || 8000}/${
        process.env.SWAGGER_PATH || 'api/docs'
      }`,
    );
  }

  const port = process.env.PORT || 8000;
  await app.listen(port);

  console.log(`🚀 Backend server running on port ${port}`);
  console.log(`🌐 Health check: http://localhost:${port}/api/health`);
}

bootstrap().catch((error) => {
  console.error('❌ Application failed to start:', error);
  process.exit(1);
});