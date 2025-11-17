import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { DataSource } from "typeorm";

describe("Full Workflow E2E Tests (회원가입 → 행사생성 → 예결산작성)", () => {
  let app: INestApplication;
  let dataSource: DataSource;

  // 테스트 컨텍스트
  let userId: string;
  let accessToken: string;
  let organizationId: string;
  let eventId: string;
  let budgetId: string;
  let settlementId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      })
    );

    app.setGlobalPrefix("api");
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    if (settlementId) {
      await dataSource.query(`DELETE FROM settlements WHERE id = $1`, [settlementId]);
    }
    if (budgetId) {
      await dataSource.query(`DELETE FROM budgets WHERE id = $1`, [budgetId]);
    }
    if (eventId) {
      await dataSource.query(`DELETE FROM events WHERE id = $1`, [eventId]);
    }
    if (organizationId && userId) {
      await dataSource.query(
        `DELETE FROM user_organizations WHERE user_id = $1 AND organization_id = $2`,
        [userId, organizationId]
      );
    }
    if (organizationId) {
      await dataSource.query(`DELETE FROM organizations WHERE id = $1`, [organizationId]);
    }
    if (userId) {
      await dataSource.query(`DELETE FROM users WHERE id = $1`, [userId]);
    }

    await app.close();
  });

  describe("Step 1: 회원가입 및 로그인", () => {
    it("새로운 사용자를 등록해야 함", async () => {
      const registerDto = {
        email: `workflow.test.${Date.now()}@example.com`,
        password: "Test1234!@",
        passwordConfirm: "Test1234!@",
        name: "워크플로우 테스트 사용자",
        phone: "010-9999-9999",
      };

      const response = await request(app.getHttpServer())
        .post("/api/auth/register")
        .send(registerDto)
        .expect(201);

      userId = response.body.user.id;
      expect(userId).toBeDefined();

      // 사용자 활성화
      await dataSource.query(
        `UPDATE users SET status = 'ACTIVE', role = 'ADMIN' WHERE id = $1`,
        [userId]
      );
    });

    it("등록한 사용자로 로그인해야 함", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/auth/login")
        .send({
          email: await dataSource.query(
            `SELECT email FROM users WHERE id = $1`,
            [userId]
          ).then(rows => rows[0].email),
          password: "Test1234!@",
        })
        .expect(200);

      accessToken = response.body.accessToken;
      expect(accessToken).toBeDefined();
    });
  });

  describe("Step 2: 단체 생성", () => {
    it("새로운 단체를 생성해야 함", async () => {
      const createOrgDto = {
        name: `테스트단체_${Date.now()}`,
        type: "CHURCH",
        address: "서울특별시 강남구",
        contactEmail: "test.org@example.com",
        contactPhone: "02-1234-5678",
        description: "E2E 테스트용 단체",
      };

      const response = await request(app.getHttpServer())
        .post("/api/organizations")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(createOrgDto)
        .expect(201);

      organizationId = response.body.id;
      expect(organizationId).toBeDefined();
      expect(response.body.name).toBe(createOrgDto.name);
    });

    it("생성한 단체에 사용자를 자동 추가해야 함", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/users/organizations")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      const userOrg = response.body.data.find(
        (org: any) => org.id === organizationId
      );
      expect(userOrg).toBeDefined();
    });
  });

  describe("Step 3: 행사 생성", () => {
    it("단체에 새로운 행사를 생성해야 함", async () => {
      const createEventDto = {
        title: `테스트행사_${Date.now()}`,
        type: "WORSHIP",
        organizationId: organizationId,
        startDate: new Date(Date.now() + 86400000).toISOString(), // 내일
        endDate: new Date(Date.now() + 172800000).toISOString(), // 모레
        location: "본당",
        description: "E2E 테스트용 행사",
        status: "PLANNED",
      };

      const response = await request(app.getHttpServer())
        .post("/api/events")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(createEventDto)
        .expect(201);

      eventId = response.body.id;
      expect(eventId).toBeDefined();
      expect(response.body.title).toBe(createEventDto.title);
    });

    it("생성한 행사를 조회할 수 있어야 함", async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/events/${eventId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(eventId);
    });
  });

  describe("Step 4: 예산서 작성", () => {
    it("행사에 대한 예산서를 생성해야 함", async () => {
      const createBudgetDto = {
        eventId: eventId,
        type: "DETAILED",
        fiscalYear: new Date().getFullYear(),
        description: "E2E 테스트 예산서",
        status: "DRAFT",
      };

      const response = await request(app.getHttpServer())
        .post("/api/budgets")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(createBudgetDto)
        .expect(201);

      budgetId = response.body.id;
      expect(budgetId).toBeDefined();
      expect(response.body.eventId).toBe(eventId);
    });

    it("예산서에 수입 항목을 추가해야 함", async () => {
      const createIncomeDto = {
        budgetId: budgetId,
        category: "DONATION",
        description: "테스트 수입 항목",
        plannedAmount: 1000000,
        status: "PLANNED",
      };

      const response = await request(app.getHttpServer())
        .post("/api/budget-items/incomes")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(createIncomeDto)
        .expect(201);

      expect(response.body.budgetId).toBe(budgetId);
      expect(response.body.plannedAmount).toBe(createIncomeDto.plannedAmount);
    });

    it("예산서에 지출 항목을 추가해야 함", async () => {
      const createExpenseDto = {
        budgetId: budgetId,
        category: "MEAL",
        description: "테스트 지출 항목",
        plannedAmount: 500000,
        status: "PLANNED",
      };

      const response = await request(app.getHttpServer())
        .post("/api/budget-items/expenses")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(createExpenseDto)
        .expect(201);

      expect(response.body.budgetId).toBe(budgetId);
      expect(response.body.plannedAmount).toBe(createExpenseDto.plannedAmount);
    });

    it("예산서 상세 정보를 조회할 수 있어야 함", async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/budgets/${budgetId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(budgetId);
      expect(response.body).toHaveProperty("incomes");
      expect(response.body).toHaveProperty("expenses");
      expect(response.body.incomes.length).toBeGreaterThan(0);
      expect(response.body.expenses.length).toBeGreaterThan(0);
    });
  });

  describe("Step 5: 결산서 작성", () => {
    it("예산서를 기반으로 결산서를 생성해야 함", async () => {
      const createSettlementDto = {
        budgetId: budgetId,
        eventId: eventId,
        type: "DETAILED",
        fiscalYear: new Date().getFullYear(),
        description: "E2E 테스트 결산서",
        status: "DRAFT",
      };

      const response = await request(app.getHttpServer())
        .post("/api/settlements")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(createSettlementDto)
        .expect(201);

      settlementId = response.body.id;
      expect(settlementId).toBeDefined();
      expect(response.body.budgetId).toBe(budgetId);
    });

    it("결산서에 항목을 추가해야 함", async () => {
      const createItemDto = {
        settlementId: settlementId,
        type: "INCOME",
        category: "DONATION",
        description: "테스트 결산 항목",
        amount: 950000,
        transactionDate: new Date().toISOString(),
        dataSource: "MANUAL",
        status: "VERIFIED",
      };

      const response = await request(app.getHttpServer())
        .post("/api/settlement-items")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(createItemDto)
        .expect(201);

      expect(response.body.settlementId).toBe(settlementId);
      expect(response.body.amount).toBe(createItemDto.amount);
    });

    it("결산서 상세 정보를 조회할 수 있어야 함", async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/settlements/${settlementId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(settlementId);
      expect(response.body).toHaveProperty("items");
      expect(response.body.items.length).toBeGreaterThan(0);
    });

    it("예산 대비 결산 비교 데이터를 조회할 수 있어야 함", async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/settlements/${settlementId}/comparison`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("budget");
      expect(response.body).toHaveProperty("settlement");
      expect(response.body).toHaveProperty("comparison");
    });
  });

  describe("Step 6: 전체 워크플로우 검증", () => {
    it("단체에 속한 모든 행사를 조회할 수 있어야 함", async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/events?organizationId=${organizationId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      const event = response.body.data.find((e: any) => e.id === eventId);
      expect(event).toBeDefined();
    });

    it("행사의 예산서와 결산서를 모두 조회할 수 있어야 함", async () => {
      // 행사 상세 조회
      const eventResponse = await request(app.getHttpServer())
        .get(`/api/events/${eventId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(eventResponse.body.id).toBe(eventId);

      // 예산서 조회
      const budgetResponse = await request(app.getHttpServer())
        .get(`/api/budgets?eventId=${eventId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(budgetResponse.body.data).toBeInstanceOf(Array);
      expect(budgetResponse.body.data.length).toBeGreaterThan(0);

      // 결산서 조회
      const settlementResponse = await request(app.getHttpServer())
        .get(`/api/settlements?eventId=${eventId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(settlementResponse.body.data).toBeInstanceOf(Array);
      expect(settlementResponse.body.data.length).toBeGreaterThan(0);
    });

    it("전체 워크플로우가 완료되었음을 확인", () => {
      expect(userId).toBeDefined();
      expect(organizationId).toBeDefined();
      expect(eventId).toBeDefined();
      expect(budgetId).toBeDefined();
      expect(settlementId).toBeDefined();
    });
  });
});
