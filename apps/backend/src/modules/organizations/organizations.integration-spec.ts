import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import * as request from "supertest";
import { DataSource } from "typeorm";
import { OrganizationsModule } from "./organizations.module";
import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";
import { User } from "../../entities/user.entity";
import { Organization } from "../../entities/organization.entity";
import { Membership } from "../../entities/membership.entity";

describe("Organizations Integration Tests", () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let createdUserIds: string[] = [];
  let createdOrgIds: string[] = [];
  let adminAccessToken: string;
  let adminUserId: string;
  let memberAccessToken: string;
  let memberUserId: string;

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
        OrganizationsModule,
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

    // ORGANIZATION_ADMIN 사용자 생성
    const adminDto = {
      email: `org-admin-${Date.now()}@example.com`,
      password: "Admin1234!@",
      passwordConfirm: "Admin1234!@",
      name: "단체관리자",
    };

    const adminResponse = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send(adminDto)
      .expect(201);

    adminUserId = adminResponse.body.user.id;
    createdUserIds.push(adminUserId);

    // ORGANIZATION_ADMIN 역할로 변경 및 활성화
    await dataSource.getRepository(User).update(
      { id: adminUserId },
      {
        role: "ORGANIZATION_ADMIN",
        status: "ACTIVE",
      }
    );

    // 로그인
    const adminLoginResponse = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({
        email: adminDto.email,
        password: adminDto.password,
      })
      .expect(200);

    adminAccessToken = adminLoginResponse.body.accessToken;

    // MEMBER 사용자 생성
    const memberDto = {
      email: `org-member-${Date.now()}@example.com`,
      password: "Member1234!@",
      passwordConfirm: "Member1234!@",
      name: "일반회원",
    };

    const memberResponse = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send(memberDto)
      .expect(201);

    memberUserId = memberResponse.body.user.id;
    createdUserIds.push(memberUserId);

    // 활성화
    await dataSource.getRepository(User).update(
      { id: memberUserId },
      {
        status: "ACTIVE",
      }
    );

    // 로그인
    const memberLoginResponse = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({
        email: memberDto.email,
        password: memberDto.password,
      })
      .expect(200);

    memberAccessToken = memberLoginResponse.body.accessToken;
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    if (createdOrgIds.length > 0) {
      await dataSource.getRepository(Organization).delete(createdOrgIds);
    }
    if (createdUserIds.length > 0) {
      await dataSource.getRepository(User).delete(createdUserIds);
    }
    await app.close();
  });

  describe("POST /api/organizations", () => {
    it("ORGANIZATION_ADMIN이 단체를 생성해야 함", async () => {
      const createOrgDto = {
        name: "테스트단체",
        type: "YOUTH_GROUP",
        description: "통합테스트용 단체",
        parentOrganization: "광남동성당",
        contactEmail: "test@example.com",
        contactPhone: "010-1234-5678",
      };

      const response = await request(app.getHttpServer())
        .post("/api/organizations")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(createOrgDto)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("name", createOrgDto.name);
      expect(response.body).toHaveProperty("type", createOrgDto.type);
      expect(response.body).toHaveProperty("description", createOrgDto.description);

      createdOrgIds.push(response.body.id);
    });

    it("MEMBER는 단체를 생성할 수 없어야 함", async () => {
      const createOrgDto = {
        name: "멤버생성시도",
        type: "YOUTH_GROUP",
      };

      await request(app.getHttpServer())
        .post("/api/organizations")
        .set("Authorization", `Bearer ${memberAccessToken}`)
        .send(createOrgDto)
        .expect(403);
    });

    it("토큰 없이 요청하면 401 에러를 반환해야 함", async () => {
      const createOrgDto = {
        name: "미인증생성시도",
        type: "YOUTH_GROUP",
      };

      await request(app.getHttpServer())
        .post("/api/organizations")
        .send(createOrgDto)
        .expect(401);
    });

    it("필수 필드 없이 요청하면 400 에러를 반환해야 함", async () => {
      const createOrgDto = {
        description: "이름 없음",
      };

      await request(app.getHttpServer())
        .post("/api/organizations")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(createOrgDto)
        .expect(400);
    });

    it("잘못된 단체 타입으로 요청하면 400 에러를 반환해야 함", async () => {
      const createOrgDto = {
        name: "잘못된타입",
        type: "INVALID_TYPE",
      };

      await request(app.getHttpServer())
        .post("/api/organizations")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(createOrgDto)
        .expect(400);
    });
  });

  describe("GET /api/organizations", () => {
    let testOrgId: string;

    beforeAll(async () => {
      // 조회 테스트용 단체 생성
      const createOrgDto = {
        name: `조회테스트단체-${Date.now()}`,
        type: "YOUTH_GROUP",
        description: "조회 테스트용",
      };

      const response = await request(app.getHttpServer())
        .post("/api/organizations")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(createOrgDto)
        .expect(201);

      testOrgId = response.body.id;
      createdOrgIds.push(testOrgId);
    });

    it("단체 목록을 조회해야 함", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/organizations")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty("total");
      expect(response.body).toHaveProperty("page");
      expect(response.body).toHaveProperty("limit");
    });

    it("페이지네이션이 작동해야 함", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/organizations?page=1&limit=5")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("page", 1);
      expect(response.body).toHaveProperty("limit", 5);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it("검색 필터가 작동해야 함", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/organizations?search=조회테스트")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      const org = response.body.data.find((o) => o.id === testOrgId);
      expect(org).toBeDefined();
    });

    it("타입 필터가 작동해야 함", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/organizations?type=YOUTH_GROUP")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((org) => {
        expect(org.type).toBe("YOUTH_GROUP");
      });
    });

    it("토큰 없이 요청하면 401 에러를 반환해야 함", async () => {
      await request(app.getHttpServer()).get("/api/organizations").expect(401);
    });
  });

  describe("GET /api/organizations/:id", () => {
    let testOrgId: string;

    beforeAll(async () => {
      // 상세 조회 테스트용 단체 생성
      const createOrgDto = {
        name: `상세조회테스트-${Date.now()}`,
        type: "CHOIR",
        description: "상세 조회 테스트용 단체",
        contactEmail: "detail@example.com",
      };

      const response = await request(app.getHttpServer())
        .post("/api/organizations")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(createOrgDto)
        .expect(201);

      testOrgId = response.body.id;
      createdOrgIds.push(testOrgId);
    });

    it("단체 상세 정보를 조회해야 함", async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/organizations/${testOrgId}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", testOrgId);
      expect(response.body).toHaveProperty("name");
      expect(response.body).toHaveProperty("type", "CHOIR");
      expect(response.body).toHaveProperty("description");
    });

    it("존재하지 않는 단체 조회 시 404 에러를 반환해야 함", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000";

      await request(app.getHttpServer())
        .get(`/api/organizations/${nonExistentId}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .expect(404);
    });

    it("잘못된 UUID 형식으로 요청하면 400 에러를 반환해야 함", async () => {
      await request(app.getHttpServer())
        .get("/api/organizations/invalid-uuid")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .expect(400);
    });

    it("토큰 없이 요청하면 401 에러를 반환해야 함", async () => {
      await request(app.getHttpServer()).get(`/api/organizations/${testOrgId}`).expect(401);
    });
  });

  describe("PUT /api/organizations/:id", () => {
    let testOrgId: string;

    beforeAll(async () => {
      // 수정 테스트용 단체 생성
      const createOrgDto = {
        name: `수정테스트단체-${Date.now()}`,
        type: "LECTOR",
        description: "수정 테스트용",
      };

      const response = await request(app.getHttpServer())
        .post("/api/organizations")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(createOrgDto)
        .expect(201);

      testOrgId = response.body.id;
      createdOrgIds.push(testOrgId);
    });

    it("단체 정보를 수정해야 함", async () => {
      const updateOrgDto = {
        description: "수정된 설명",
        contactEmail: "updated@example.com",
        contactPhone: "010-9999-8888",
      };

      const response = await request(app.getHttpServer())
        .put(`/api/organizations/${testOrgId}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(updateOrgDto)
        .expect(200);

      expect(response.body).toHaveProperty("description", updateOrgDto.description);
      expect(response.body).toHaveProperty("contactEmail", updateOrgDto.contactEmail);
      expect(response.body).toHaveProperty("contactPhone", updateOrgDto.contactPhone);
    });

    it("존재하지 않는 단체 수정 시 404 에러를 반환해야 함", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000";
      const updateOrgDto = {
        description: "수정 시도",
      };

      await request(app.getHttpServer())
        .put(`/api/organizations/${nonExistentId}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(updateOrgDto)
        .expect(404);
    });

    it("토큰 없이 요청하면 401 에러를 반환해야 함", async () => {
      const updateOrgDto = {
        description: "수정 시도",
      };

      await request(app.getHttpServer())
        .put(`/api/organizations/${testOrgId}`)
        .send(updateOrgDto)
        .expect(401);
    });
  });

  describe("DELETE /api/organizations/:id", () => {
    it("단체를 삭제(비활성화)해야 함", async () => {
      // 삭제 테스트용 단체 생성
      const createOrgDto = {
        name: `삭제테스트단체-${Date.now()}`,
        type: "ALTAR_SERVER",
      };

      const createResponse = await request(app.getHttpServer())
        .post("/api/organizations")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(createOrgDto)
        .expect(201);

      const orgId = createResponse.body.id;
      createdOrgIds.push(orgId);

      // 삭제 (soft delete)
      await request(app.getHttpServer())
        .delete(`/api/organizations/${orgId}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .expect(200);

      // 삭제된 단체 조회 시 404 또는 status가 INACTIVE인지 확인
      const getResponse = await request(app.getHttpServer())
        .get(`/api/organizations/${orgId}`)
        .set("Authorization", `Bearer ${adminAccessToken}`);

      // soft delete의 경우 404 또는 status: INACTIVE
      if (getResponse.status === 200) {
        expect(getResponse.body.status).toBe("INACTIVE");
      } else {
        expect(getResponse.status).toBe(404);
      }
    });

    it("존재하지 않는 단체 삭제 시 404 에러를 반환해야 함", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000";

      await request(app.getHttpServer())
        .delete(`/api/organizations/${nonExistentId}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .expect(404);
    });

    it("토큰 없이 요청하면 401 에러를 반환해야 함", async () => {
      const testId = "00000000-0000-0000-0000-000000000000";

      await request(app.getHttpServer()).delete(`/api/organizations/${testId}`).expect(401);
    });
  });
});
