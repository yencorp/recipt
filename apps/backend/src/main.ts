import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { LoggerMiddleware } from "./common/middlewares/logger.middleware";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 글로벌 예외 필터 설정
  app.useGlobalFilters(new HttpExceptionFilter());

  // 로거 미들웨어 설정
  app.use(new LoggerMiddleware().use.bind(new LoggerMiddleware()));

  // 글로벌 프리픽스 설정
  app.setGlobalPrefix(process.env.API_PREFIX || "api");

  // CORS 설정
  if (process.env.ENABLE_CORS === "true") {
    app.enableCors({
      origin: process.env.CORS_ORIGIN?.split(",") || "*",
      credentials: process.env.CORS_CREDENTIALS === "true",
    });
  }

  // 글로벌 파이프 설정 (유효성 검사)
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  // Swagger 설정
  if (process.env.ENABLE_SWAGGER !== "false") {
    const config = new DocumentBuilder()
      .setTitle("Recipt API")
      .setDescription(
        "단체 재무 관리를 위한 REST API 문서\n\n" +
        "## 인증\n" +
        "대부분의 엔드포인트는 JWT 인증이 필요합니다.\n" +
        "1. `/auth/login` 또는 `/auth/register`로 토큰을 발급받으세요.\n" +
        "2. 우측 상단의 'Authorize' 버튼을 클릭하여 토큰을 입력하세요.\n\n" +
        "## 역할 (Roles)\n" +
        "- **ADMIN**: 시스템 관리자 - 모든 기능 접근 가능\n" +
        "- **ORG_ADMIN**: 조직 관리자 - 조직 내 모든 기능 관리\n" +
        "- **ORG_MEMBER**: 조직 멤버 - 조직 내 제한적 기능\n" +
        "- **QA**: 품질 보증 - 읽기 전용 접근\n" +
        "- **USER**: 일반 사용자 - 기본 기능만 사용\n\n" +
        "## Rate Limiting\n" +
        "API 호출은 15분당 100회로 제한됩니다.\n\n" +
        "## 응답 형식\n" +
        "모든 성공 응답은 다음 형식을 따릅니다:\n" +
        "```json\n" +
        "{\n" +
        '  "success": true,\n' +
        '  "data": { ... },\n' +
        '  "timestamp": "2025-11-17T12:00:00.000Z",\n' +
        '  "path": "/api/events"\n' +
        "}\n" +
        "```"
      )
      .setVersion("1.0.0")
      .setContact("Recipt Team", "https://recipt.app", "support@recipt.app")
      .setLicense("MIT", "https://opensource.org/licenses/MIT")
      .addBearerAuth(
        {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT 토큰을 입력하세요 (로그인 후 발급)",
        },
        "JWT"
      )
      .addTag("Auth", "인증 및 회원가입")
      .addTag("Users", "사용자 관리")
      .addTag("Organizations", "조직 관리")
      .addTag("Events", "행사 관리")
      .addTag("Budgets", "예산 관리")
      .addTag("Settlements", "정산 관리")
      .addTag("Receipts", "영수증 및 OCR")
      .addTag("Posts", "게시판")
      .addTag("Notifications", "알림")
      .addTag("Files", "파일 업로드")
      .addTag("Admin", "관리자")
      .addTag("Health", "헬스체크")
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(process.env.SWAGGER_PATH || "api/docs", app, document, {
      customSiteTitle: "Recipt API Documentation",
      customCss: `
        .topbar-wrapper img { content: url('/favicon.ico'); width: 40px; height: auto; }
        .swagger-ui .topbar { background-color: #2563eb; }
        .swagger-ui .info .title { color: #1e40af; }
      `,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
      },
    });

    console.log(
      `📚 Swagger UI: http://localhost:${process.env.PORT || 3000}/${
        process.env.SWAGGER_PATH || "api/docs"
      }`
    );
    console.log(
      `📄 Swagger JSON: http://localhost:${process.env.PORT || 3000}/${
        process.env.SWAGGER_PATH || "api/docs"
      }-json`
    );
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Backend server running on port ${port}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`💚 Health check: http://localhost:${port}/api/health`);
}

bootstrap().catch((error) => {
  console.error("❌ Application failed to start:", error);
  process.exit(1);
});
