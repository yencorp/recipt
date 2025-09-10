/* eslint-disable no-console */
import { DataSource } from "typeorm";
import {
  Budget,
  BudgetType,
  BudgetStatus,
  ApprovalStatus,
} from "../../entities/budget.entity";
import {
  BudgetIncome,
  IncomeCategory,
  IncomeStatus,
} from "../../entities/budget-income.entity";
import {
  BudgetExpense,
  ExpenseCategory,
  ExpenseStatus,
} from "../../entities/budget-expense.entity";
import {
  Settlement,
  SettlementStatus,
  SettlementType,
} from "../../entities/settlement.entity";
import {
  ReceiptScan,
  ReceiptStatus,
  ReceiptType,
  FileFormat,
  ProcessingStatus,
} from "../../entities/receipt-scan.entity";
import { Organization } from "../../entities/organization.entity";
import { Event } from "../../entities/event.entity";
import { User } from "../../entities/user.entity";

/**
 * 샘플 예산서/결산서 데이터 시드
 * Task 2.11: 각 조직 및 행사별 다양한 예산서와 결산서 예시 데이터 생성
 *
 * 생성되는 데이터:
 * - 청년회: 수련회 예산서(완료), 정기모임 예산서(진행중)
 * - 자모회: 친교모임 예산서(승인), 김장봉사 결산서(완료)
 * - 초등부: 성경학교 예산서(완료), 체험학습 예산서(계획)
 * - 중고등부: 수련회 예산서(승인), 진로멘토링 예산서(진행중)
 */
export async function seedSampleBudgets(dataSource: DataSource): Promise<void> {
  console.log("🌱 샘플 예산서/결산서 데이터 시드 시작...");

  const budgetRepository = dataSource.getRepository(Budget);
  const budgetIncomeRepository = dataSource.getRepository(BudgetIncome);
  const budgetExpenseRepository = dataSource.getRepository(BudgetExpense);
  const settlementRepository = dataSource.getRepository(Settlement);
  const receiptScanRepository = dataSource.getRepository(ReceiptScan);
  const organizationRepository = dataSource.getRepository(Organization);
  const eventRepository = dataSource.getRepository(Event);
  const userRepository = dataSource.getRepository(User);

  // 기존 예산 데이터 확인
  const existingBudgetsCount = await budgetRepository.count();
  if (existingBudgetsCount > 0) {
    console.log(
      `⚠️  이미 ${existingBudgetsCount}개의 예산서가 존재합니다. 시드를 건너뜁니다.`
    );
    return;
  }

  try {
    // 기본 데이터 가져오기
    const organizations = await organizationRepository.find();
    const events = await eventRepository.find();
    const users = await userRepository.find({ where: { isActive: true } });

    if (
      organizations.length === 0 ||
      events.length === 0 ||
      users.length === 0
    ) {
      throw new Error(
        "필요한 기본 데이터가 없습니다. 조직, 행사, 사용자 시드를 먼저 실행해주세요."
      );
    }

    const getOrgUser = (orgId: string) => {
      return (
        users.find((u) => u.preferences?.defaultOrganization === orgId) ||
        users[0]
      );
    };

    const budgets = [];
    const incomes = [];
    const expenses = [];
    const settlements = [];
    const receiptScans = [];

    // 1. 청년회 수련회 예산서 (완료된 행사)
    const youthGroup = organizations.find((org) => org.name === "청년회");
    const youthRetreatEvent = events.find(
      (e) => e.title === "2024년 청년 수련회"
    );

    if (youthGroup && youthRetreatEvent) {
      const youthUser = getOrgUser(youthGroup.id);

      // 수련회 예산서 (완료됨)
      const youthRetreatBudget = budgetRepository.create({
        organizationId: youthGroup.id,
        eventId: youthRetreatEvent.id,
        createdBy: youthUser.id,
        approvedBy: youthUser.id,
        title: "2024년 청년 수련회 예산서",
        description:
          "청년회 여름 수련회 예산 계획입니다. 45명 참석 예정으로 계획했습니다.",
        type: BudgetType.EVENT,
        status: BudgetStatus.COMPLETED,
        approvalStatus: ApprovalStatus.APPROVED,
        budgetYear: 2024,
        budgetPeriod: 8, // 8월
        periodStartDate: new Date("2024-08-15"),
        periodEndDate: new Date("2024-08-17"),
        totalIncomeAmount: 6750000,
        totalExpenseAmount: 6500000,
        totalActualIncome: 6750000,
        totalActualExpense: 6420000,
        remainingAmount: 330000,
        executionRate: 98.77,
        currency: "KRW",
        submittedAt: new Date("2024-07-15"),
        reviewedAt: new Date("2024-07-18"),
        approvedAt: new Date("2024-07-20"),
        reviewNotes: "전체적으로 합리적인 예산 계획입니다.",
        approvalNotes: "승인합니다. 예산 집행 시 영수증 보관 철저히 해주세요.",
        metadata: {
          tags: ["수련회", "청년", "여름"],
          categories: ["행사예산"],
          priority: "HIGH",
          requiresApproval: true,
          approvalThreshold: 5000000,
        },
        notes: "성공적으로 완료된 수련회 예산입니다.",
        version: 1,
        isFinal: true,
        isActive: true,
      });
      budgets.push(youthRetreatBudget);

      // 수련회 수입 항목들
      const youthRetreatIncomes = [
        {
          itemName: "참가비",
          description: "수련회 참가비 (1인당 150,000원 × 45명)",
          category: IncomeCategory.EVENT_INCOME,
          status: IncomeStatus.RECEIVED,
          budgetAmount: 6750000,
          actualAmount: 6750000,
          completionRate: 100,
          currency: "KRW",
          source: "청년회 회원",
          responsiblePerson: "김청년",
          expectedDate: new Date("2024-08-10"),
          receivedDate: new Date("2024-08-10"),
          receiptMethod: "계좌이체",
          isRecurring: false,
          displayOrder: 1,
          metadata: {
            tags: ["참가비"],
            receiptRequired: true,
          },
          notes: "모든 참가자가 기한 내에 납부 완료했습니다.",
        },
      ];

      youthRetreatIncomes.forEach((incomeData, _index) => {
        incomes.push(
          budgetIncomeRepository.create({
            ...incomeData,
            budgetId: youthRetreatBudget.id,
          })
        );
      });

      // 수련회 지출 항목들
      const youthRetreatExpenses = [
        {
          itemName: "숙박비",
          description: "청평수양관 숙박비 (3일 2박)",
          category: ExpenseCategory.ACCOMMODATION,
          status: ExpenseStatus.PAID,
          budgetAmount: 2700000,
          actualAmount: 2700000,
          quantity: 1,
          unitPrice: 2700000,
          currency: "KRW",
          vendor: "청평수양관",
          vendorContact: "031-123-4567",
          responsiblePerson: "이총무",
          plannedDate: new Date("2024-08-15"),
          actualDate: new Date("2024-08-15"),
          paymentMethod: "계좌이체",
          receiptNumber: "2024081501",
          displayOrder: 1,
          metadata: {
            tags: ["숙박"],
            receiptRequired: true,
          },
          notes: "깨끗한 시설로 참가자들이 만족했습니다.",
        },
        {
          itemName: "식비",
          description: "3일간 식사비 (조식 2회, 중식 3회, 석식 2회)",
          category: ExpenseCategory.FOOD,
          status: ExpenseStatus.PAID,
          budgetAmount: 2250000,
          actualAmount: 2200000,
          quantity: 45,
          unitPrice: 48888,
          currency: "KRW",
          vendor: "청평수양관 식당",
          responsiblePerson: "박청년",
          plannedDate: new Date("2024-08-15"),
          actualDate: new Date("2024-08-15"),
          paymentMethod: "현금",
          receiptNumber: "2024081502",
          displayOrder: 2,
          metadata: {
            tags: ["식비"],
            receiptRequired: true,
          },
          notes: "건강하고 맛있는 식단으로 구성했습니다.",
        },
        {
          itemName: "강사비",
          description: "수련회 강사 사례비",
          category: ExpenseCategory.SPEAKER_FEE,
          status: ExpenseStatus.PAID,
          budgetAmount: 500000,
          actualAmount: 500000,
          quantity: 1,
          unitPrice: 500000,
          currency: "KRW",
          vendor: "김목사",
          responsiblePerson: "김청년",
          plannedDate: new Date("2024-08-16"),
          actualDate: new Date("2024-08-16"),
          paymentMethod: "현금",
          displayOrder: 3,
          metadata: {
            tags: ["강사비"],
          },
          notes: "은혜로운 말씀으로 큰 도움이 되었습니다.",
        },
        {
          itemName: "프로그램 운영비",
          description: "레크레이션 용품 및 상품비",
          category: ExpenseCategory.SUPPLIES,
          status: ExpenseStatus.PAID,
          budgetAmount: 300000,
          actualAmount: 280000,
          quantity: 1,
          unitPrice: 280000,
          currency: "KRW",
          vendor: "문구점",
          responsiblePerson: "최청년",
          plannedDate: new Date("2024-08-10"),
          actualDate: new Date("2024-08-10"),
          paymentMethod: "카드",
          receiptNumber: "2024081003",
          displayOrder: 4,
          metadata: {
            tags: ["프로그램", "용품"],
          },
          notes: "다양한 레크레이션 용품을 구입했습니다.",
        },
        {
          itemName: "교통비",
          description: "버스 임차비 (왕복)",
          category: ExpenseCategory.TRANSPORTATION,
          status: ExpenseStatus.PAID,
          budgetAmount: 600000,
          actualAmount: 580000,
          quantity: 1,
          unitPrice: 580000,
          currency: "KRW",
          vendor: "청년여행사",
          vendorContact: "02-123-4567",
          responsiblePerson: "정청년",
          plannedDate: new Date("2024-08-15"),
          actualDate: new Date("2024-08-15"),
          paymentMethod: "계좌이체",
          receiptNumber: "2024081504",
          displayOrder: 5,
          metadata: {
            tags: ["교통비", "버스"],
          },
          notes: "안전한 운행으로 무사히 다녀왔습니다.",
        },
        {
          itemName: "기타 운영비",
          description: "응급약품, 생수 등 기타 필요품",
          category: ExpenseCategory.OTHER,
          status: ExpenseStatus.PAID,
          budgetAmount: 150000,
          actualAmount: 160000,
          quantity: 1,
          unitPrice: 160000,
          currency: "KRW",
          vendor: "마트",
          responsiblePerson: "김청년",
          plannedDate: new Date("2024-08-14"),
          actualDate: new Date("2024-08-14"),
          paymentMethod: "현금",
          displayOrder: 6,
          metadata: {
            tags: ["기타", "응급용품"],
          },
          notes: "안전한 수련회를 위한 필수품들입니다.",
        },
      ];

      youthRetreatExpenses.forEach((expenseData) => {
        expenses.push(
          budgetExpenseRepository.create({
            ...expenseData,
            budgetId: youthRetreatBudget.id,
          })
        );
      });

      // 수련회 결산서
      const youthRetreatSettlement = settlementRepository.create({
        organizationId: youthGroup.id,
        eventId: youthRetreatEvent.id,
        budgetId: youthRetreatBudget.id,
        createdBy: youthUser.id,
        // completedBy: youthUser.id, // 속성이 없음
        title: "2024년 청년 수련회 결산서",
        description: "청년 수련회 최종 결산 내역입니다.",
        type: SettlementType.EVENT,
        status: SettlementStatus.FINAL,
        totalIncomeAmount: 6750000,
        totalExpenseAmount: 6420000,
        netAmount: 330000,
        // receiptCount: 6, // 속성이 없음
        currency: "KRW",
        periodStartDate: new Date("2024-08-15"),
        periodEndDate: new Date("2024-08-20"),
        settlementYear: 2024,
        submittedAt: new Date("2024-08-25"),
        reviewedAt: new Date("2024-08-26"),
        finalizedAt: new Date("2024-08-27"),
        reviewNotes: "영수증 관리가 잘 되어 있습니다.",
        metadata: {
          tags: ["수련회", "완료"],
          totalParticipants: 45,
          actualParticipants: 45,
          costPerPerson: 142666,
        },
        notes:
          "성공적으로 완료된 수련회였습니다. 남은 예산은 차기 활동에 활용 예정입니다.",
        isActive: true,
      });
      settlements.push(youthRetreatSettlement);
    }

    // 2. 자모회 친교 모임 예산서 (승인됨)
    const mothersGroup = organizations.find((org) => org.name === "자모회");
    const mothersEvent = events.find((e) => e.title === "자모회 친교 모임");

    if (mothersGroup && mothersEvent) {
      const mothersUser = getOrgUser(mothersGroup.id);

      const mothersBudget = budgetRepository.create({
        organizationId: mothersGroup.id,
        eventId: mothersEvent.id,
        createdBy: mothersUser.id,
        approvedBy: mothersUser.id,
        title: "자모회 12월 친교 모임 예산서",
        description: "월례 친교 모임 예산 계획입니다.",
        type: BudgetType.EVENT,
        status: BudgetStatus.APPROVED,
        approvalStatus: ApprovalStatus.APPROVED,
        budgetYear: 2024,
        budgetPeriod: 12,
        periodStartDate: new Date("2024-12-14"),
        periodEndDate: new Date("2024-12-14"),
        totalIncomeAmount: 500000,
        totalExpenseAmount: 480000,
        totalActualIncome: 0,
        totalActualExpense: 0,
        remainingAmount: 20000,
        currency: "KRW",
        submittedAt: new Date("2024-12-01"),
        reviewedAt: new Date("2024-12-02"),
        approvedAt: new Date("2024-12-03"),
        approvalNotes: "소규모 모임 예산으로 적절합니다.",
        metadata: {
          tags: ["친교", "정기모임"],
          priority: "MEDIUM",
        },
        notes: "따뜻한 친교 모임을 위한 예산입니다.",
        version: 1,
        isActive: true,
      });
      budgets.push(mothersBudget);

      // 자모회 수입
      const mothersIncomes = [
        {
          itemName: "회비",
          description: "자모회 월 회비 (20명 × 25,000원)",
          category: IncomeCategory.MEMBERSHIP_FEE,
          status: IncomeStatus.EXPECTED,
          budgetAmount: 500000,
          actualAmount: null,
          source: "자모회 회원",
          expectedDate: new Date("2024-12-14"),
          displayOrder: 1,
        },
      ];

      mothersIncomes.forEach((incomeData) => {
        incomes.push(
          budgetIncomeRepository.create({
            ...incomeData,
            budgetId: mothersBudget.id,
          })
        );
      });

      // 자모회 지출
      const mothersExpenses = [
        {
          itemName: "다과비",
          description: "커피, 차, 간식 등",
          category: ExpenseCategory.FOOD,
          status: ExpenseStatus.PLANNED,
          budgetAmount: 300000,
          quantity: 20,
          unitPrice: 15000,
          plannedDate: new Date("2024-12-14"),
          displayOrder: 1,
        },
        {
          itemName: "프로그램 운영비",
          description: "소규모 활동 및 게임 용품",
          category: ExpenseCategory.SUPPLIES,
          status: ExpenseStatus.PLANNED,
          budgetAmount: 100000,
          quantity: 1,
          unitPrice: 100000,
          plannedDate: new Date("2024-12-13"),
          displayOrder: 2,
        },
        {
          itemName: "기타 비용",
          description: "장소 정리 및 기타 필요품",
          category: ExpenseCategory.OTHER,
          status: ExpenseStatus.PLANNED,
          budgetAmount: 80000,
          quantity: 1,
          unitPrice: 80000,
          plannedDate: new Date("2024-12-14"),
          displayOrder: 3,
        },
      ];

      mothersExpenses.forEach((expenseData) => {
        expenses.push(
          budgetExpenseRepository.create({
            ...expenseData,
            budgetId: mothersBudget.id,
          })
        );
      });
    }

    // 3. 초등부 성경학교 예산서 (완료됨)
    const elementarySchool = organizations.find(
      (org) => org.name === "초등부 주일학교"
    );
    const elementaryEvent = events.find((e) => e.title === "여름 성경학교");

    if (elementarySchool && elementaryEvent) {
      const elementaryUser = getOrgUser(elementarySchool.id);

      const elementaryBudget = budgetRepository.create({
        organizationId: elementarySchool.id,
        eventId: elementaryEvent.id,
        createdBy: elementaryUser.id,
        approvedBy: elementaryUser.id,
        title: "2024년 여름 성경학교 예산서",
        description: "초등부 여름 성경학교 운영 예산입니다.",
        type: BudgetType.EVENT,
        status: BudgetStatus.COMPLETED,
        approvalStatus: ApprovalStatus.APPROVED,
        budgetYear: 2024,
        budgetPeriod: 8,
        periodStartDate: new Date("2024-08-05"),
        periodEndDate: new Date("2024-08-09"),
        totalIncomeAmount: 1750000,
        totalExpenseAmount: 1680000,
        totalActualIncome: 1750000,
        totalActualExpense: 1650000,
        remainingAmount: 100000,
        executionRate: 98.21,
        currency: "KRW",
        submittedAt: new Date("2024-07-10"),
        approvedAt: new Date("2024-07-15"),
        approvalNotes: "교육 목적에 맞는 적절한 예산입니다.",
        metadata: {
          tags: ["성경학교", "초등부", "여름", "교육"],
          priority: "HIGH",
        },
        notes: "아이들의 신앙 교육을 위한 소중한 프로그램이었습니다.",
        version: 1,
        isFinal: true,
        isActive: true,
      });
      budgets.push(elementaryBudget);

      // 초등부 수입
      const elementaryIncomes = [
        {
          itemName: "참가비",
          description: "성경학교 참가비 (35명 × 50,000원)",
          category: IncomeCategory.EVENT_INCOME,
          status: IncomeStatus.RECEIVED,
          budgetAmount: 1750000,
          actualAmount: 1750000,
          completionRate: 100,
          source: "학부모",
          expectedDate: new Date("2024-08-01"),
          receivedDate: new Date("2024-08-01"),
          receiptMethod: "현금/계좌이체",
          displayOrder: 1,
        },
      ];

      elementaryIncomes.forEach((incomeData) => {
        incomes.push(
          budgetIncomeRepository.create({
            ...incomeData,
            budgetId: elementaryBudget.id,
          })
        );
      });

      // 초등부 지출
      const elementaryExpenses = [
        {
          itemName: "교재비",
          description: "성경학교 교재 및 워크북",
          category: ExpenseCategory.SUPPLIES,
          status: ExpenseStatus.PAID,
          budgetAmount: 700000,
          actualAmount: 680000,
          quantity: 35,
          unitPrice: 19428,
          vendor: "기독교서점",
          plannedDate: new Date("2024-08-01"),
          actualDate: new Date("2024-08-01"),
          paymentMethod: "카드",
          displayOrder: 1,
        },
        {
          itemName: "간식비",
          description: "5일간 오전 간식 (35명 × 5일)",
          category: ExpenseCategory.FOOD,
          status: ExpenseStatus.PAID,
          budgetAmount: 525000,
          actualAmount: 520000,
          quantity: 175,
          unitPrice: 2971,
          vendor: "베이커리",
          plannedDate: new Date("2024-08-05"),
          actualDate: new Date("2024-08-05"),
          paymentMethod: "현금",
          displayOrder: 2,
        },
        {
          itemName: "만들기 재료",
          description: "공작 활동용 재료 (색종이, 풀, 가위 등)",
          category: ExpenseCategory.SUPPLIES,
          status: ExpenseStatus.PAID,
          budgetAmount: 300000,
          actualAmount: 290000,
          quantity: 1,
          unitPrice: 290000,
          vendor: "문구점",
          plannedDate: new Date("2024-08-02"),
          actualDate: new Date("2024-08-02"),
          paymentMethod: "현금",
          displayOrder: 3,
        },
        {
          itemName: "상품 및 선물",
          description: "우수 학생 상품 및 수료 선물",
          category: ExpenseCategory.GIFTS,
          status: ExpenseStatus.PAID,
          budgetAmount: 155000,
          actualAmount: 160000,
          quantity: 35,
          unitPrice: 4571,
          vendor: "완구점",
          plannedDate: new Date("2024-08-08"),
          actualDate: new Date("2024-08-08"),
          paymentMethod: "카드",
          displayOrder: 4,
        },
      ];

      elementaryExpenses.forEach((expenseData) => {
        expenses.push(
          budgetExpenseRepository.create({
            ...expenseData,
            budgetId: elementaryBudget.id,
          })
        );
      });

      // 초등부 결산서
      const elementarySettlement = settlementRepository.create({
        organizationId: elementarySchool.id,
        eventId: elementaryEvent.id,
        budgetId: elementaryBudget.id,
        createdBy: elementaryUser.id,
        // completedBy: elementaryUser.id, // 속성이 없음
        title: "2024년 여름 성경학교 결산서",
        description: "성경학교 결산 내역입니다.",
        type: SettlementType.EVENT,
        status: SettlementStatus.FINAL,
        totalIncomeAmount: 1750000,
        totalExpenseAmount: 1650000,
        netAmount: 100000,
        // receiptCount: 4, // 속성이 없음
        currency: "KRW",
        periodStartDate: new Date("2024-08-10"),
        periodEndDate: new Date("2024-08-12"),
        settlementYear: 2024,
        finalizedAt: new Date("2024-08-15"),
        metadata: {
          tags: ["성경학교", "완료"],
          totalParticipants: 35,
          costPerPerson: 47142,
        },
        notes: "아이들이 즐겁게 참여한 성경학교였습니다.",
        isActive: true,
      });
      settlements.push(elementarySettlement);
    }

    // 4. 중고등부 수련회 예산서 (승인됨, 미래 행사)
    const youthSchool = organizations.find(
      (org) => org.name === "중고등부 주일학교"
    );
    const youthSchoolEvent = events.find(
      (e) => e.title === "중고등부 겨울 수련회"
    );

    if (youthSchool && youthSchoolEvent) {
      const youthSchoolUser = getOrgUser(youthSchool.id);

      const youthSchoolBudget = budgetRepository.create({
        organizationId: youthSchool.id,
        eventId: youthSchoolEvent.id,
        createdBy: youthSchoolUser.id,
        approvedBy: youthSchoolUser.id,
        title: "2025년 중고등부 겨울 수련회 예산서",
        description: "중고등부 겨울 수련회 예산 계획입니다.",
        type: BudgetType.EVENT,
        status: BudgetStatus.APPROVED,
        approvalStatus: ApprovalStatus.APPROVED,
        budgetYear: 2025,
        budgetPeriod: 1,
        periodStartDate: new Date("2025-01-03"),
        periodEndDate: new Date("2025-01-05"),
        totalIncomeAmount: 4200000,
        totalExpenseAmount: 4100000,
        totalActualIncome: 0,
        totalActualExpense: 0,
        remainingAmount: 100000,
        currency: "KRW",
        submittedAt: new Date("2024-12-01"),
        approvedAt: new Date("2024-12-05"),
        approvalNotes: "청소년 대상 수련회로 교육적 가치가 높습니다.",
        metadata: {
          tags: ["수련회", "중고등부", "겨울", "청소년"],
          priority: "HIGH",
          expectedParticipants: 35,
        },
        notes: "청소년들의 신앙 성장을 위한 중요한 행사입니다.",
        version: 1,
        isActive: true,
      });
      budgets.push(youthSchoolBudget);

      // 중고등부 수입
      const youthSchoolIncomes = [
        {
          itemName: "참가비",
          description: "수련회 참가비 (35명 × 120,000원)",
          category: IncomeCategory.EVENT_INCOME,
          status: IncomeStatus.EXPECTED,
          budgetAmount: 4200000,
          source: "학생 및 학부모",
          expectedDate: new Date("2024-12-28"),
          displayOrder: 1,
          metadata: {
            tags: ["참가비"],
            paymentDeadline: "2024-12-25",
          },
        },
      ];

      youthSchoolIncomes.forEach((incomeData) => {
        incomes.push(
          budgetIncomeRepository.create({
            ...incomeData,
            budgetId: youthSchoolBudget.id,
          })
        );
      });

      // 중고등부 지출
      const youthSchoolExpenses = [
        {
          itemName: "숙박비",
          description: "수련원 숙박비 (3일 2박)",
          category: ExpenseCategory.ACCOMMODATION,
          status: ExpenseStatus.APPROVED,
          budgetAmount: 1800000,
          quantity: 35,
          unitPrice: 51428,
          vendor: "파라다이스 청소년 수련원",
          plannedDate: new Date("2025-01-03"),
          displayOrder: 1,
        },
        {
          itemName: "식비",
          description: "3일간 식사비",
          category: ExpenseCategory.FOOD,
          status: ExpenseStatus.APPROVED,
          budgetAmount: 1400000,
          quantity: 35,
          unitPrice: 40000,
          vendor: "수련원 식당",
          plannedDate: new Date("2025-01-03"),
          displayOrder: 2,
        },
        {
          itemName: "교통비",
          description: "버스 임차비",
          category: ExpenseCategory.TRANSPORTATION,
          status: ExpenseStatus.APPROVED,
          budgetAmount: 500000,
          quantity: 1,
          unitPrice: 500000,
          vendor: "관광버스",
          plannedDate: new Date("2025-01-03"),
          displayOrder: 3,
        },
        {
          itemName: "강사비",
          description: "청소년 전문 강사 사례비",
          category: ExpenseCategory.SPEAKER_FEE,
          status: ExpenseStatus.APPROVED,
          budgetAmount: 300000,
          quantity: 1,
          unitPrice: 300000,
          plannedDate: new Date("2025-01-04"),
          displayOrder: 4,
        },
        {
          itemName: "프로그램 운영비",
          description: "레크리에이션 및 교육 자료",
          category: ExpenseCategory.SUPPLIES,
          status: ExpenseStatus.PLANNED,
          budgetAmount: 100000,
          quantity: 1,
          unitPrice: 100000,
          plannedDate: new Date("2025-01-02"),
          displayOrder: 5,
        },
      ];

      youthSchoolExpenses.forEach((expenseData) => {
        expenses.push(
          budgetExpenseRepository.create({
            ...expenseData,
            budgetId: youthSchoolBudget.id,
          })
        );
      });
    }

    // 데이터베이스에 저장
    const savedBudgets = await budgetRepository.save(budgets);
    console.log(`✅ ${savedBudgets.length}개의 예산서가 생성되었습니다.`);

    // Budget ID 업데이트 후 관련 데이터 저장
    const budgetIds = new Map();
    savedBudgets.forEach((budget, index) => {
      budgetIds.set(budgets[index].title, budget.id);
    });

    // 수입/지출 데이터의 budgetId 업데이트
    incomes.forEach((income) => {
      const budget = savedBudgets.find((b) => income.budgetId === b.id);
      if (budget) {
        income.budgetId = budget.id;
      }
    });

    expenses.forEach((expense) => {
      const budget = savedBudgets.find((b) => expense.budgetId === b.id);
      if (budget) {
        expense.budgetId = budget.id;
      }
    });

    settlements.forEach((settlement) => {
      const budget = savedBudgets.find((b) => settlement.budgetId === b.id);
      if (budget) {
        settlement.budgetId = budget.id;
      }
    });

    const savedIncomes = await budgetIncomeRepository.save(incomes);
    const savedExpenses = await budgetExpenseRepository.save(expenses);
    const savedSettlements = await settlementRepository.save(settlements);

    console.log(`✅ ${savedIncomes.length}개의 수입 항목이 생성되었습니다.`);
    console.log(`✅ ${savedExpenses.length}개의 지출 항목이 생성되었습니다.`);
    console.log(`✅ ${savedSettlements.length}개의 결산서가 생성되었습니다.`);

    // 5. 영수증 샘플 데이터 생성
    console.log("🧾 샘플 영수증 데이터 생성 중...");

    // 청년회 수련회 영수증들
    if (youthGroup) {
      const youthUser = getOrgUser(youthGroup.id);

      const youthReceiptScans = [
        {
          uploadedBy: youthUser.id,
          organizationId: youthGroup.id,
          originalFileName: "청평수양관_숙박비_영수증.jpg",
          filePath:
            "/uploads/receipts/2024/08/youth_retreat_accommodation_001.jpg",
          fileUrl:
            "https://storage.church.org/receipts/youth_retreat_accommodation_001.jpg",
          thumbnailPath:
            "/uploads/thumbnails/youth_retreat_accommodation_001_thumb.jpg",
          fileFormat: FileFormat.JPEG,
          fileSize: 1024000, // 1MB
          fileHash: "a1b2c3d4e5f6g7h8i9j0",
          receiptType: ReceiptType.RECEIPT,
          status: ReceiptStatus.VALIDATED,
          processingStatus: ProcessingStatus.COMPLETED,
          receiptDate: new Date("2024-08-15"),
          vendorName: "청평수양관",
          totalAmount: 2700000,
          currency: "KRW",
          ocrConfidence: 0.95,
          isOcrProcessed: true,
          isValidated: true,
          validatedBy: youthUser.id,
          validatedAt: new Date("2024-08-16"),
          uploadedAt: new Date("2024-08-16"),
          metadata: {
            tags: ["숙박비", "수련회", "청평수양관"],
            category: "ACCOMMODATION",
            eventName: "2024년 청년 수련회",
            paymentMethod: "계좌이체",
            businessNumber: "123-45-67890",
            receiptNumber: "2024081501",
          },
          notes: "청년 수련회 숙박비 영수증입니다.",
          isActive: true,
        },
        {
          uploadedBy: youthUser.id,
          organizationId: youthGroup.id,
          originalFileName: "식비_영수증_종합.pdf",
          filePath: "/uploads/receipts/2024/08/youth_retreat_food_002.pdf",
          fileFormat: FileFormat.PDF,
          fileSize: 856000, // 856KB
          fileHash: "b2c3d4e5f6g7h8i9j0k1",
          receiptType: ReceiptType.RECEIPT,
          status: ReceiptStatus.VALIDATED,
          processingStatus: ProcessingStatus.COMPLETED,
          receiptDate: new Date("2024-08-15"),
          vendorName: "청평수양관 식당",
          totalAmount: 2200000,
          currency: "KRW",
          ocrConfidence: 0.88,
          isOcrProcessed: true,
          isValidated: true,
          validatedBy: youthUser.id,
          validatedAt: new Date("2024-08-16"),
          uploadedAt: new Date("2024-08-16"),
          metadata: {
            tags: ["식비", "수련회", "단체급식"],
            category: "FOOD",
            eventName: "2024년 청년 수련회",
            paymentMethod: "현금",
            mealCount: 7,
            participantCount: 45,
          },
          notes: "3일간 7회 식사비 통합 영수증입니다.",
          isActive: true,
        },
        {
          uploadedBy: youthUser.id,
          organizationId: youthGroup.id,
          originalFileName: "버스임차비_영수증.jpg",
          filePath: "/uploads/receipts/2024/08/youth_retreat_transport_003.jpg",
          thumbnailPath:
            "/uploads/thumbnails/youth_retreat_transport_003_thumb.jpg",
          fileFormat: FileFormat.JPEG,
          fileSize: 723000,
          fileHash: "c3d4e5f6g7h8i9j0k1l2",
          receiptType: ReceiptType.TAX_INVOICE,
          status: ReceiptStatus.VALIDATED,
          processingStatus: ProcessingStatus.COMPLETED,
          receiptDate: new Date("2024-08-15"),
          vendorName: "청년여행사",
          vendorBusinessNumber: "234-56-78901",
          vendorAddress: "서울시 강남구 청담동 123-45",
          vendorPhone: "02-123-4567",
          totalAmount: 580000,
          currency: "KRW",
          ocrConfidence: 0.92,
          isOcrProcessed: true,
          isValidated: true,
          validatedBy: youthUser.id,
          validatedAt: new Date("2024-08-16"),
          uploadedAt: new Date("2024-08-16"),
          metadata: {
            tags: ["교통비", "버스임차", "수련회"],
            category: "TRANSPORTATION",
            eventName: "2024년 청년 수련회",
            paymentMethod: "계좌이체",
            businessNumber: "234-56-78901",
            taxInvoiceNumber: "2024081504",
            distance: "120km",
            busType: "45인승 대형버스",
          },
          notes: "수련회 왕복 버스 임차비 세금계산서입니다.",
          isActive: true,
        },
        {
          uploadedBy: youthUser.id,
          organizationId: youthGroup.id,
          originalFileName: "마트_기타용품_현금영수증.png",
          filePath: "/uploads/receipts/2024/08/youth_retreat_supplies_004.png",
          thumbnailPath:
            "/uploads/thumbnails/youth_retreat_supplies_004_thumb.png",
          fileFormat: FileFormat.PNG,
          fileSize: 445000,
          fileHash: "d4e5f6g7h8i9j0k1l2m3",
          receiptType: ReceiptType.CASH_RECEIPT,
          status: ReceiptStatus.VALIDATED,
          processingStatus: ProcessingStatus.COMPLETED,
          receiptDate: new Date("2024-08-14"),
          vendorName: "이마트 청평점",
          totalAmount: 160000,
          currency: "KRW",
          ocrConfidence: 0.87,
          isOcrProcessed: true,
          isValidated: true,
          validatedBy: youthUser.id,
          validatedAt: new Date("2024-08-15"),
          uploadedAt: new Date("2024-08-15"),
          metadata: {
            tags: ["기타용품", "응급약품", "생수"],
            category: "SUPPLIES",
            eventName: "2024년 청년 수련회",
            paymentMethod: "현금",
            cashReceiptNumber: "2024081401",
            itemCount: 12,
          },
          notes: "수련회 기타 필요용품 구입 현금영수증입니다.",
          isActive: true,
        },
      ];

      youthReceiptScans.forEach((receiptData) => {
        receiptScans.push(receiptScanRepository.create(receiptData));
      });
    }

    // 초등부 성경학교 영수증들
    if (elementarySchool) {
      const elementaryUser = getOrgUser(elementarySchool.id);

      const elementaryReceiptScans = [
        {
          uploadedBy: elementaryUser.id,
          organizationId: elementarySchool.id,
          originalFileName: "기독교서점_교재비_영수증.jpg",
          filePath: "/uploads/receipts/2024/08/elementary_books_001.jpg",
          thumbnailPath: "/uploads/thumbnails/elementary_books_001_thumb.jpg",
          fileFormat: FileFormat.JPEG,
          fileSize: 892000,
          fileHash: "e5f6g7h8i9j0k1l2m3n4",
          receiptType: ReceiptType.RECEIPT,
          status: ReceiptStatus.VALIDATED,
          processingStatus: ProcessingStatus.COMPLETED,
          receiptDate: new Date("2024-08-01"),
          vendorName: "생명의말씀사",
          totalAmount: 680000,
          currency: "KRW",
          ocrConfidence: 0.91,
          isOcrProcessed: true,
          isValidated: true,
          validatedBy: elementaryUser.id,
          validatedAt: new Date("2024-08-02"),
          uploadedAt: new Date("2024-08-02"),
          metadata: {
            tags: ["교재비", "성경학교", "교육자료"],
            category: "SUPPLIES",
            eventName: "2024년 여름 성경학교",
            paymentMethod: "카드",
            itemCount: 35,
            pricePerItem: 19428,
          },
          notes: "성경학교 교재 구입 영수증입니다.",
          isActive: true,
        },
        {
          uploadedBy: elementaryUser.id,
          organizationId: elementarySchool.id,
          originalFileName: "베이커리_간식비_영수증.jpg",
          filePath: "/uploads/receipts/2024/08/elementary_snacks_002.jpg",
          thumbnailPath: "/uploads/thumbnails/elementary_snacks_002_thumb.jpg",
          fileFormat: FileFormat.JPEG,
          fileSize: 634000,
          fileHash: "f6g7h8i9j0k1l2m3n4o5",
          receiptType: ReceiptType.SIMPLE_RECEIPT,
          status: ReceiptStatus.VALIDATED,
          processingStatus: ProcessingStatus.COMPLETED,
          receiptDate: new Date("2024-08-05"),
          vendorName: "파리바게뜨 청평점",
          totalAmount: 520000,
          currency: "KRW",
          ocrConfidence: 0.85,
          isOcrProcessed: true,
          isValidated: true,
          validatedBy: elementaryUser.id,
          validatedAt: new Date("2024-08-05"),
          uploadedAt: new Date("2024-08-05"),
          metadata: {
            tags: ["간식비", "빵", "성경학교"],
            category: "FOOD",
            eventName: "2024년 여름 성경학교",
            paymentMethod: "현금",
            days: 5,
            studentsCount: 35,
          },
          notes: "5일간 오전 간식비 영수증입니다.",
          isActive: true,
        },
      ];

      elementaryReceiptScans.forEach((receiptData) => {
        receiptScans.push(receiptScanRepository.create(receiptData));
      });
    }

    // 영수증 데이터 저장
    const savedReceiptScans = await receiptScanRepository.save(receiptScans);
    console.log(
      `✅ ${savedReceiptScans.length}개의 영수증 샘플이 생성되었습니다.`
    );

    // 통계 정보 출력
    const budgetsByStatus = {
      완료: savedBudgets.filter((b) => b.status === BudgetStatus.COMPLETED)
        .length,
      승인: savedBudgets.filter((b) => b.status === BudgetStatus.APPROVED)
        .length,
      진행중: savedBudgets.filter((b) => b.status === BudgetStatus.ACTIVE)
        .length,
    };

    console.log(`\n📊 예산서 상태별 통계:`);
    Object.entries(budgetsByStatus).forEach(([status, count]) => {
      if (count > 0) {
        console.log(`   - ${status}: ${count}개`);
      }
    });

    const totalBudgetAmount = savedBudgets.reduce(
      (sum, budget) => sum + budget.totalIncomeAmount,
      0
    );
    console.log(`\n💰 총 예산 규모: ${totalBudgetAmount.toLocaleString()}원`);
  } catch (error) {
    console.error("❌ 샘플 예산서/결산서 시드 데이터 생성 실패:", error);
    throw error;
  }
}
