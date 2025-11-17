import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import * as request from "supertest";
import { DataSource } from "typeorm";
import { UsersModule } from "./users.module";
import { AuthModule } from "../auth/auth.module";
import { User } from "../../entities/user.entity";
import { Organization } from "../../entities/organization.entity";
import { Membership } from "../../entities/membership.entity";

describe("Users Integration Tests", () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let createdUserIds: string[] = [];
  let accessToken: string;
  let userId: string;

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
        UsersModule,
        AuthModule,
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

    // 테스트용 사용자 생성 및 로그인
    const registerDto = {
      email: `users-test-${Date.now()}@example.com`,
      password: "UsersTest1234!@",
      passwordConfirm: "UsersTest1234!@",
      name: "사용자테스트",
      phoneNumber: "010-1234-5678",
    };

    const registerResponse = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send(registerDto)
      .expect(201);

    userId = registerResponse.body.user.id;
    createdUserIds.push(userId);

    // 사용자 활성화
    await dataSource.getRepository(User).update({ id: userId }, { status: "ACTIVE" });

    // 로그인하여 액세스 토큰 획득
    const loginResponse = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({
        email: registerDto.email,
        password: registerDto.password,
      })
      .expect(200);

    accessToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    // 테스트에서 생성된 사용자 정리
    if (createdUserIds.length > 0) {
      await dataSource.getRepository(User).delete(createdUserIds);
    }
    await app.close();
  });

  describe("GET /api/users/profile", () => {
    it("현재 로그인한 사용자의 프로필을 조회해야 함", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/users/profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", userId);
      expect(response.body).toHaveProperty("email");
      expect(response.body).toHaveProperty("name");
      expect(response.body).not.toHaveProperty("passwordHash");
    });

    it("토큰 없이 요청하면 401 에러를 반환해야 함", async () => {
      await request(app.getHttpServer()).get("/api/users/profile").expect(401);
    });
  });

  describe("PUT /api/users/profile", () => {
    it("프로필 정보를 업데이트해야 함", async () => {
      const updateDto = {
        name: "업데이트된이름",
        phoneNumber: "010-9876-5432",
        profileImage: "https://example.com/new-image.jpg",
      };

      const response = await request(app.getHttpServer())
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toHaveProperty("name", updateDto.name);
      expect(response.body).toHaveProperty("phoneNumber", updateDto.phoneNumber);
      expect(response.body).toHaveProperty("profileImage", updateDto.profileImage);
    });

    it("이메일은 업데이트할 수 없어야 함", async () => {
      const updateDto = {
        name: "테스트",
        email: "newemail@example.com", // 이메일 변경 시도
      };

      const response = await request(app.getHttpServer())
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updateDto)
        .expect(200);

      // 이메일이 변경되지 않았는지 확인
      expect(response.body.email).not.toBe("newemail@example.com");
    });

    it("토큰 없이 요청하면 401 에러를 반환해야 함", async () => {
      const updateDto = {
        name: "업데이트테스트",
      };

      await request(app.getHttpServer())
        .put("/api/users/profile")
        .send(updateDto)
        .expect(401);
    });
  });

  describe("GET /api/users/:id", () => {
    it("특정 사용자 정보를 조회해야 함", async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/users/${userId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", userId);
      expect(response.body).toHaveProperty("email");
      expect(response.body).toHaveProperty("name");
      expect(response.body).not.toHaveProperty("passwordHash");
    });

    it("존재하지 않는 사용자 조회 시 404 에러를 반환해야 함", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000";

      await request(app.getHttpServer())
        .get(`/api/users/${nonExistentId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(404);
    });

    it("잘못된 UUID 형식으로 요청하면 400 에러를 반환해야 함", async () => {
      await request(app.getHttpServer())
        .get("/api/users/invalid-uuid")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(400);
    });

    it("토큰 없이 요청하면 401 에러를 반환해야 함", async () => {
      await request(app.getHttpServer()).get(`/api/users/${userId}`).expect(401);
    });
  });

  describe("PUT /api/users/:id/password", () => {
    let testPassword: string;

    beforeAll(() => {
      testPassword = "UsersTest1234!@";
    });

    it("비밀번호를 성공적으로 변경해야 함", async () => {
      const changePasswordDto = {
        currentPassword: testPassword,
        newPassword: "NewPassword1234!@",
        newPasswordConfirm: "NewPassword1234!@",
      };

      await request(app.getHttpServer())
        .put(`/api/users/${userId}/password`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(changePasswordDto)
        .expect(200);

      // 새 비밀번호로 로그인 확인
      const user = await dataSource.getRepository(User).findOne({ where: { id: userId } });
      const loginDto = {
        email: user.email,
        password: changePasswordDto.newPassword,
      };

      const loginResponse = await request(app.getHttpServer())
        .post("/api/auth/login")
        .send(loginDto)
        .expect(200);

      expect(loginResponse.body).toHaveProperty("accessToken");

      // 비밀번호 원복 (다른 테스트 영향 방지)
      const resetDto = {
        currentPassword: changePasswordDto.newPassword,
        newPassword: testPassword,
        newPasswordConfirm: testPassword,
      };

      await request(app.getHttpServer())
        .put(`/api/users/${userId}/password`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(resetDto)
        .expect(200);
    });

    it("현재 비밀번호가 틀리면 401 에러를 반환해야 함", async () => {
      const changePasswordDto = {
        currentPassword: "WrongPassword123!@",
        newPassword: "NewPassword1234!@",
        newPasswordConfirm: "NewPassword1234!@",
      };

      const response = await request(app.getHttpServer())
        .put(`/api/users/${userId}/password`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(changePasswordDto)
        .expect(401);

      expect(response.body.message).toContain("현재 비밀번호가 일치하지 않습니다");
    });

    it("새 비밀번호와 확인 비밀번호가 다르면 400 에러를 반환해야 함", async () => {
      const changePasswordDto = {
        currentPassword: testPassword,
        newPassword: "NewPassword1234!@",
        newPasswordConfirm: "DifferentPassword1234!@",
      };

      const response = await request(app.getHttpServer())
        .put(`/api/users/${userId}/password`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(changePasswordDto)
        .expect(400);

      expect(response.body.message).toContain("일치하지 않습니다");
    });

    it("새 비밀번호가 규칙을 위반하면 400 에러를 반환해야 함", async () => {
      const changePasswordDto = {
        currentPassword: testPassword,
        newPassword: "weak",
        newPasswordConfirm: "weak",
      };

      await request(app.getHttpServer())
        .put(`/api/users/${userId}/password`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(changePasswordDto)
        .expect(400);
    });

    it("다른 사용자의 비밀번호는 변경할 수 없어야 함", async () => {
      // 새 사용자 생성
      const newUserDto = {
        email: `other-user-${Date.now()}@example.com`,
        password: "OtherUser1234!@",
        passwordConfirm: "OtherUser1234!@",
        name: "다른사용자",
      };

      const registerResponse = await request(app.getHttpServer())
        .post("/api/auth/register")
        .send(newUserDto)
        .expect(201);

      const otherUserId = registerResponse.body.user.id;
      createdUserIds.push(otherUserId);

      // 다른 사용자의 비밀번호 변경 시도
      const changePasswordDto = {
        currentPassword: testPassword,
        newPassword: "NewPassword1234!@",
        newPasswordConfirm: "NewPassword1234!@",
      };

      await request(app.getHttpServer())
        .put(`/api/users/${otherUserId}/password`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(changePasswordDto)
        .expect(403);
    });

    it("토큰 없이 요청하면 401 에러를 반환해야 함", async () => {
      const changePasswordDto = {
        currentPassword: testPassword,
        newPassword: "NewPassword1234!@",
        newPasswordConfirm: "NewPassword1234!@",
      };

      await request(app.getHttpServer())
        .put(`/api/users/${userId}/password`)
        .send(changePasswordDto)
        .expect(401);
    });
  });

  describe("GET /api/users/:id/settings", () => {
    it("사용자 설정을 조회해야 함", async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/users/${userId}/settings`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("language");
      expect(response.body).toHaveProperty("timezone");
      expect(response.body).toHaveProperty("emailNotifications");
      expect(response.body).toHaveProperty("pushNotifications");
    });

    it("다른 사용자의 설정은 조회할 수 없어야 함", async () => {
      // 새 사용자 생성
      const newUserDto = {
        email: `settings-user-${Date.now()}@example.com`,
        password: "SettingsUser1234!@",
        passwordConfirm: "SettingsUser1234!@",
        name: "설정사용자",
      };

      const registerResponse = await request(app.getHttpServer())
        .post("/api/auth/register")
        .send(newUserDto)
        .expect(201);

      const otherUserId = registerResponse.body.user.id;
      createdUserIds.push(otherUserId);

      // 다른 사용자의 설정 조회 시도
      await request(app.getHttpServer())
        .get(`/api/users/${otherUserId}/settings`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(403);
    });

    it("토큰 없이 요청하면 401 에러를 반환해야 함", async () => {
      await request(app.getHttpServer())
        .get(`/api/users/${userId}/settings`)
        .expect(401);
    });
  });

  describe("PUT /api/users/:id/settings", () => {
    it("사용자 설정을 업데이트해야 함", async () => {
      const updateSettingsDto = {
        language: "en",
        timezone: "America/New_York",
        emailNotifications: false,
        pushNotifications: true,
      };

      const response = await request(app.getHttpServer())
        .put(`/api/users/${userId}/settings`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updateSettingsDto)
        .expect(200);

      expect(response.body).toHaveProperty("language", updateSettingsDto.language);
      expect(response.body).toHaveProperty("timezone", updateSettingsDto.timezone);
      expect(response.body).toHaveProperty(
        "emailNotifications",
        updateSettingsDto.emailNotifications
      );
      expect(response.body).toHaveProperty(
        "pushNotifications",
        updateSettingsDto.pushNotifications
      );
    });

    it("일부 설정만 업데이트할 수 있어야 함", async () => {
      const updateSettingsDto = {
        language: "ko",
      };

      const response = await request(app.getHttpServer())
        .put(`/api/users/${userId}/settings`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updateSettingsDto)
        .expect(200);

      expect(response.body).toHaveProperty("language", "ko");
      expect(response.body).toHaveProperty("timezone"); // 기존 값 유지
    });

    it("다른 사용자의 설정은 업데이트할 수 없어야 함", async () => {
      // 새 사용자 생성
      const newUserDto = {
        email: `update-settings-${Date.now()}@example.com`,
        password: "UpdateSettings1234!@",
        passwordConfirm: "UpdateSettings1234!@",
        name: "설정업데이트사용자",
      };

      const registerResponse = await request(app.getHttpServer())
        .post("/api/auth/register")
        .send(newUserDto)
        .expect(201);

      const otherUserId = registerResponse.body.user.id;
      createdUserIds.push(otherUserId);

      // 다른 사용자의 설정 업데이트 시도
      const updateSettingsDto = {
        language: "en",
      };

      await request(app.getHttpServer())
        .put(`/api/users/${otherUserId}/settings`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updateSettingsDto)
        .expect(403);
    });

    it("토큰 없이 요청하면 401 에러를 반환해야 함", async () => {
      const updateSettingsDto = {
        language: "en",
      };

      await request(app.getHttpServer())
        .put(`/api/users/${userId}/settings`)
        .send(updateSettingsDto)
        .expect(401);
    });
  });
});
