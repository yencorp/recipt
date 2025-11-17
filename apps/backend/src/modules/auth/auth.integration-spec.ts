import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import * as request from "supertest";
import { DataSource } from "typeorm";
import { AuthModule } from "./auth.module";
import { UsersModule } from "../users/users.module";
import { User } from "../../entities/user.entity";
import { Organization } from "../../entities/organization.entity";
import { Membership } from "../../entities/membership.entity";

describe("Auth Integration Tests", () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let createdUserIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ".env",
        }),
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            type: "postgres",
            host: configService.get<string>("DATABASE_HOST", "localhost"),
            port: configService.get<number>("DATABASE_PORT", 5432),
            username: configService.get<string>("DATABASE_USER", "postgres"),
            password: configService.get<string>("DATABASE_PASSWORD", "postgres"),
            database: configService.get<string>("DATABASE_NAME", "recipt_db"),
            entities: [User, Organization, Membership],
            synchronize: false,
            logging: false,
          }),
        }),
        JwtModule.registerAsync({
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            secret: configService.get<string>("JWT_SECRET", "test-secret"),
            signOptions: {
              expiresIn: configService.get<string>("JWT_ACCESS_EXPIRATION", "7d"),
            },
          }),
        }),
        AuthModule,
        UsersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );

    await app.init();
    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    // 테스트에서 생성된 사용자 정리
    if (createdUserIds.length > 0) {
      await dataSource.getRepository(User).delete(createdUserIds);
    }
    await app.close();
  });

  describe("POST /api/auth/register", () => {
    it("새로운 사용자를 성공적으로 등록해야 함", async () => {
      const registerDto = {
        email: `test-${Date.now()}@example.com`,
        password: "Test1234!@",
        passwordConfirm: "Test1234!@",
        name: "통합테스트사용자",
        phoneNumber: "010-1234-5678",
      };

      const response = await request(app.getHttpServer())
        .post("/api/auth/register")
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("refreshToken");
      expect(response.body.user.email).toBe(registerDto.email);
      expect(response.body.user.name).toBe(registerDto.name);
      expect(response.body.user).not.toHaveProperty("passwordHash");

      // 생성된 사용자 ID 저장 (cleanup용)
      createdUserIds.push(response.body.user.id);
    });

    it("이메일이 중복되면 400 에러를 반환해야 함", async () => {
      const registerDto = {
        email: `duplicate-${Date.now()}@example.com`,
        password: "Test1234!@",
        passwordConfirm: "Test1234!@",
        name: "중복테스트",
      };

      // 첫 번째 등록
      const firstResponse = await request(app.getHttpServer())
        .post("/api/auth/register")
        .send(registerDto)
        .expect(201);

      createdUserIds.push(firstResponse.body.user.id);

      // 두 번째 등록 (중복)
      const response = await request(app.getHttpServer())
        .post("/api/auth/register")
        .send(registerDto)
        .expect(400);

      expect(response.body.message).toContain("이미 존재하는 이메일");
    });

    it("비밀번호가 일치하지 않으면 400 에러를 반환해야 함", async () => {
      const registerDto = {
        email: `test-password-mismatch-${Date.now()}@example.com`,
        password: "Test1234!@",
        passwordConfirm: "Different1234!@",
        name: "비밀번호불일치테스트",
      };

      const response = await request(app.getHttpServer())
        .post("/api/auth/register")
        .send(registerDto)
        .expect(400);

      expect(response.body.message).toContain("일치하지 않습니다");
    });

    it("비밀번호 규칙을 위반하면 400 에러를 반환해야 함", async () => {
      const registerDto = {
        email: `test-weak-password-${Date.now()}@example.com`,
        password: "weak",
        passwordConfirm: "weak",
        name: "약한비밀번호테스트",
      };

      const response = await request(app.getHttpServer())
        .post("/api/auth/register")
        .send(registerDto)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe("POST /api/auth/login", () => {
    let testUser: { email: string; password: string; id: string };

    beforeAll(async () => {
      // 로그인 테스트용 사용자 생성
      const registerDto = {
        email: `login-test-${Date.now()}@example.com`,
        password: "LoginTest1234!@",
        passwordConfirm: "LoginTest1234!@",
        name: "로그인테스트사용자",
      };

      const response = await request(app.getHttpServer())
        .post("/api/auth/register")
        .send(registerDto)
        .expect(201);

      testUser = {
        email: registerDto.email,
        password: registerDto.password,
        id: response.body.user.id,
      };
      createdUserIds.push(testUser.id);

      // 사용자 활성화 (PENDING_VERIFICATION → ACTIVE)
      await dataSource
        .getRepository(User)
        .update({ id: testUser.id }, { status: "ACTIVE" });
    });

    it("올바른 이메일과 비밀번호로 로그인해야 함", async () => {
      const loginDto = {
        email: testUser.email,
        password: testUser.password,
      };

      const response = await request(app.getHttpServer())
        .post("/api/auth/login")
        .send(loginDto)
        .expect(200);

      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("refreshToken");
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).not.toHaveProperty("passwordHash");
    });

    it("잘못된 비밀번호로 로그인 시 401 에러를 반환해야 함", async () => {
      const loginDto = {
        email: testUser.email,
        password: "WrongPassword123!@",
      };

      const response = await request(app.getHttpServer())
        .post("/api/auth/login")
        .send(loginDto)
        .expect(401);

      expect(response.body.message).toContain("비밀번호가 일치하지 않습니다");
    });

    it("존재하지 않는 이메일로 로그인 시 401 에러를 반환해야 함", async () => {
      const loginDto = {
        email: "nonexistent@example.com",
        password: "SomePassword123!@",
      };

      const response = await request(app.getHttpServer())
        .post("/api/auth/login")
        .send(loginDto)
        .expect(401);

      expect(response.body.message).toContain("사용자를 찾을 수 없습니다");
    });

    it("비활성화된 사용자는 로그인할 수 없어야 함", async () => {
      // PENDING_VERIFICATION 상태의 새 사용자 생성
      const registerDto = {
        email: `inactive-${Date.now()}@example.com`,
        password: "Inactive1234!@",
        passwordConfirm: "Inactive1234!@",
        name: "비활성사용자",
      };

      const registerResponse = await request(app.getHttpServer())
        .post("/api/auth/register")
        .send(registerDto)
        .expect(201);

      createdUserIds.push(registerResponse.body.user.id);

      // 로그인 시도
      const loginDto = {
        email: registerDto.email,
        password: registerDto.password,
      };

      const response = await request(app.getHttpServer())
        .post("/api/auth/login")
        .send(loginDto)
        .expect(401);

      expect(response.body.message).toContain("활성화되지 않은 사용자");
    });
  });

  describe("POST /api/auth/refresh", () => {
    let testUser: { email: string; password: string; id: string };
    let refreshToken: string;

    beforeAll(async () => {
      // 리프레시 토큰 테스트용 사용자 생성 및 로그인
      const registerDto = {
        email: `refresh-test-${Date.now()}@example.com`,
        password: "RefreshTest1234!@",
        passwordConfirm: "RefreshTest1234!@",
        name: "리프레시테스트",
      };

      const registerResponse = await request(app.getHttpServer())
        .post("/api/auth/register")
        .send(registerDto)
        .expect(201);

      testUser = {
        email: registerDto.email,
        password: registerDto.password,
        id: registerResponse.body.user.id,
      };
      createdUserIds.push(testUser.id);

      // 사용자 활성화
      await dataSource
        .getRepository(User)
        .update({ id: testUser.id }, { status: "ACTIVE" });

      // 로그인하여 리프레시 토큰 획득
      const loginResponse = await request(app.getHttpServer())
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      refreshToken = loginResponse.body.refreshToken;
    });

    it("유효한 리프레시 토큰으로 새 액세스 토큰을 발급받아야 함", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/auth/refresh")
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("refreshToken");
      expect(typeof response.body.accessToken).toBe("string");
    });

    it("잘못된 리프레시 토큰으로 401 에러를 반환해야 함", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/auth/refresh")
        .send({ refreshToken: "invalid-token" })
        .expect(401);

      expect(response.body.message).toBeDefined();
    });
  });

  describe("GET /api/auth/me", () => {
    let testUser: { email: string; password: string; id: string };
    let accessToken: string;

    beforeAll(async () => {
      // 인증된 요청 테스트용 사용자 생성
      const registerDto = {
        email: `me-test-${Date.now()}@example.com`,
        password: "MeTest1234!@",
        passwordConfirm: "MeTest1234!@",
        name: "Me테스트",
      };

      const registerResponse = await request(app.getHttpServer())
        .post("/api/auth/register")
        .send(registerDto)
        .expect(201);

      testUser = {
        email: registerDto.email,
        password: registerDto.password,
        id: registerResponse.body.user.id,
      };
      createdUserIds.push(testUser.id);

      // 사용자 활성화 및 로그인
      await dataSource
        .getRepository(User)
        .update({ id: testUser.id }, { status: "ACTIVE" });

      const loginResponse = await request(app.getHttpServer())
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      accessToken = loginResponse.body.accessToken;
    });

    it("유효한 토큰으로 현재 사용자 정보를 조회해야 함", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", testUser.id);
      expect(response.body).toHaveProperty("email", testUser.email);
      expect(response.body).not.toHaveProperty("passwordHash");
    });

    it("토큰 없이 요청하면 401 에러를 반환해야 함", async () => {
      await request(app.getHttpServer()).get("/api/auth/me").expect(401);
    });

    it("잘못된 토큰으로 요청하면 401 에러를 반환해야 함", async () => {
      await request(app.getHttpServer())
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });
  });
});
