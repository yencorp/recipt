import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { DataSource } from "typeorm";

describe("Auth E2E Tests", () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let createdUserIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Global pipes
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      })
    );

    // API prefix 설정 (main.ts와 동일하게)
    app.setGlobalPrefix("api");

    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    // 테스트 중 생성된 사용자 삭제
    if (createdUserIds.length > 0) {
      await dataSource.query(
        `DELETE FROM users WHERE id = ANY($1::uuid[])`,
        [createdUserIds]
      );
    }

    await app.close();
  });

  describe("POST /api/auth/register", () => {
    it("새로운 사용자를 성공적으로 등록해야 함", async () => {
      const registerDto = {
        email: `test.${Date.now()}@example.com`,
        password: "Test1234!@",
        passwordConfirm: "Test1234!@",
        name: "테스트 사용자",
        phone: "010-1234-5678",
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

      createdUserIds.push(response.body.user.id);
    });

    it("이메일이 중복되면 400 에러를 반환해야 함", async () => {
      const registerDto = {
        email: `duplicate.${Date.now()}@example.com`,
        password: "Test1234!@",
        passwordConfirm: "Test1234!@",
        name: "중복 테스트",
      };

      // 첫 번째 등록
      const firstResponse = await request(app.getHttpServer())
        .post("/api/auth/register")
        .send(registerDto)
        .expect(201);

      createdUserIds.push(firstResponse.body.user.id);

      // 두 번째 등록 (중복)
      await request(app.getHttpServer())
        .post("/api/auth/register")
        .send(registerDto)
        .expect(400);
    });

    it("비밀번호가 일치하지 않으면 400 에러를 반환해야 함", async () => {
      const registerDto = {
        email: `password.mismatch.${Date.now()}@example.com`,
        password: "Test1234!@",
        passwordConfirm: "Different1234!@",
        name: "비밀번호 불일치 테스트",
      };

      const response = await request(app.getHttpServer())
        .post("/api/auth/register")
        .send(registerDto)
        .expect(400);

      expect(response.body.message).toContain("일치하지 않습니다");
    });
  });

  describe("POST /api/auth/login", () => {
    let testUser: { email: string; password: string; id: string };

    beforeAll(async () => {
      // 테스트용 사용자 생성 및 활성화
      const registerDto = {
        email: `login.test.${Date.now()}@example.com`,
        password: "Test1234!@",
        passwordConfirm: "Test1234!@",
        name: "로그인 테스트 사용자",
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
      await dataSource.query(
        `UPDATE users SET status = 'ACTIVE' WHERE id = $1`,
        [testUser.id]
      );
    });

    it("올바른 이메일과 비밀번호로 로그인해야 함", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("refreshToken");
      expect(response.body.user.email).toBe(testUser.email);

      accessToken = response.body.accessToken;
    });

    it("잘못된 비밀번호로 로그인 시 401 에러를 반환해야 함", async () => {
      await request(app.getHttpServer())
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: "WrongPassword123!@",
        })
        .expect(401);
    });

    it("존재하지 않는 이메일로 로그인 시 401 에러를 반환해야 함", async () => {
      await request(app.getHttpServer())
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "Test1234!@",
        })
        .expect(401);
    });
  });

  describe("GET /api/auth/me", () => {
    let userId: string;
    let userAccessToken: string;

    beforeAll(async () => {
      // 테스트용 사용자 생성 및 활성화
      const registerDto = {
        email: `me.test.${Date.now()}@example.com`,
        password: "Test1234!@",
        passwordConfirm: "Test1234!@",
        name: "ME 테스트 사용자",
      };

      const registerResponse = await request(app.getHttpServer())
        .post("/api/auth/register")
        .send(registerDto)
        .expect(201);

      userId = registerResponse.body.user.id;
      createdUserIds.push(userId);

      // 사용자 활성화
      await dataSource.query(
        `UPDATE users SET status = 'ACTIVE' WHERE id = $1`,
        [userId]
      );

      // 로그인하여 토큰 획득
      const loginResponse = await request(app.getHttpServer())
        .post("/api/auth/login")
        .send({
          email: registerDto.email,
          password: registerDto.password,
        })
        .expect(200);

      userAccessToken = loginResponse.body.accessToken;
    });

    it("유효한 토큰으로 현재 사용자 정보를 조회해야 함", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${userAccessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", userId);
      expect(response.body).toHaveProperty("email");
    });

    it("토큰 없이 요청하면 401 에러를 반환해야 함", async () => {
      await request(app.getHttpServer())
        .get("/api/auth/me")
        .expect(401);
    });
  });
});
