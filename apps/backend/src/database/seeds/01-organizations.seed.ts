/* eslint-disable no-console */
import { DataSource } from "typeorm";
import {
  Organization,
  OrganizationType,
  OrganizationStatus,
} from "../../entities/organization.entity";

/**
 * 기본 단체 데이터 시드
 * Task 2.10: 청년회, 자모회, 초등부, 중고등부 조직 생성
 */
export async function seedOrganizations(dataSource: DataSource): Promise<void> {
  console.log("🌱 기본 단체 데이터 시드 시작...");

  const organizationRepository = dataSource.getRepository(Organization);

  // 기존 조직 데이터 확인
  const existingOrgsCount = await organizationRepository.count();
  if (existingOrgsCount > 0) {
    console.log(
      `⚠️  이미 ${existingOrgsCount}개의 조직이 존재합니다. 시드를 건너뜁니다.`
    );
    return;
  }

  // 기본 조직 설정 템플릿
  const defaultSettings = {
    allowPublicBudgets: false,
    requireReceiptApproval: true,
    autoGenerateReports: true,
    fiscalYearStart: "01-01", // 1월 1일
    budgetApprovalWorkflow: true,
  };

  const defaultStatistics = {
    totalMembers: 0,
    totalEvents: 0,
    totalBudgets: 0,
    totalSettlements: 0,
    lastActivityAt: new Date(),
  };

  // 기본 조직 데이터
  const organizationsData = [
    {
      name: "청년회",
      type: OrganizationType.YOUTH_GROUP,
      description: "교회 청년회 - 20대~30대 청년들의 모임",
      status: OrganizationStatus.ACTIVE,
      priority: 1,
      defaultCurrency: "KRW",
      representative: "청년회장",
      contactEmail: "youth@church.org",
      contactPhone: "010-0000-0001",
      address: "교회 본당 2층 청년실",
      settings: {
        ...defaultSettings,
        allowPublicBudgets: true, // 청년회는 공개 예산 허용
        fiscalYearStart: "03-01", // 3월 시작 (신학기)
      },
      statistics: defaultStatistics,
      isActive: true,
      notes: "교회의 주력 청년 단체로 다양한 활동과 행사를 진행합니다.",
    },
    {
      name: "자모회",
      type: OrganizationType.MOTHERS_GROUP,
      description: "교회 어머니들의 모임 - 가정과 교회를 위한 기도와 섬김",
      status: OrganizationStatus.ACTIVE,
      priority: 2,
      defaultCurrency: "KRW",
      representative: "자모회장",
      contactEmail: "mothers@church.org",
      contactPhone: "010-0000-0002",
      address: "교회 본당 1층 자모실",
      settings: {
        ...defaultSettings,
        requireReceiptApproval: false, // 자모회는 소액 지출이 많아 간소화
      },
      statistics: defaultStatistics,
      isActive: true,
      notes: "교회 어머니들의 친목과 신앙 성장을 위한 모임입니다.",
    },
    {
      name: "초등부 주일학교",
      type: OrganizationType.ELEMENTARY_SUNDAY_SCHOOL,
      description: "초등학생 대상 주일학교 - 어린이 신앙 교육과 활동",
      status: OrganizationStatus.ACTIVE,
      priority: 3,
      defaultCurrency: "KRW",
      representative: "초등부 부장",
      contactEmail: "elementary@church.org",
      contactPhone: "010-0000-0003",
      address: "교회 교육관 1층 초등부실",
      settings: {
        ...defaultSettings,
        budgetApprovalWorkflow: false, // 교육비는 간단한 승인 프로세스
        fiscalYearStart: "03-01", // 신학기 기준
      },
      statistics: defaultStatistics,
      isActive: true,
      notes: "초등학생들의 신앙 교육과 다양한 체험 활동을 진행합니다.",
    },
    {
      name: "중고등부 주일학교",
      type: OrganizationType.YOUTH_SUNDAY_SCHOOL,
      description: "중고등학생 대상 주일학교 - 청소년 신앙 교육과 멘토링",
      status: OrganizationStatus.ACTIVE,
      priority: 4,
      defaultCurrency: "KRW",
      representative: "중고등부 부장",
      contactEmail: "youth-school@church.org",
      contactPhone: "010-0000-0004",
      address: "교회 교육관 2층 중고등부실",
      settings: {
        ...defaultSettings,
        allowPublicBudgets: true, // 청소년 활동 투명성 확보
        fiscalYearStart: "03-01", // 신학기 기준
      },
      statistics: defaultStatistics,
      isActive: true,
      notes: "중고등학생들의 신앙 성장과 진로 멘토링을 제공합니다.",
    },
  ];

  try {
    // 조직 데이터 생성
    const organizations = organizationsData.map((orgData) =>
      organizationRepository.create(orgData)
    );

    // 데이터베이스에 저장
    await organizationRepository.save(organizations);

    console.log(`✅ ${organizations.length}개의 기본 조직이 생성되었습니다:`);
    organizations.forEach((org) => {
      console.log(`   - ${org.name} (${org.getTypeDisplayName()})`);
    });
  } catch (error) {
    console.error("❌ 조직 시드 데이터 생성 실패:", error);
    throw error;
  }
}
