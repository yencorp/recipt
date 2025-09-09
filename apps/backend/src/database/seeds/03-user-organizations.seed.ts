/* eslint-disable no-console */
import { DataSource } from "typeorm";
import { User } from "../../entities/user.entity";
import { Organization } from "../../entities/organization.entity";
import {
  UserOrganization,
  OrganizationRole,
  MembershipStatus,
} from "../../entities/user-organization.entity";

/**
 * 사용자-조직 관계 시드
 * Task 2.10: 관리자 계정들을 각 조직에 적절한 권한으로 연결
 */
export async function seedUserOrganizations(
  dataSource: DataSource
): Promise<void> {
  console.log("🌱 사용자-조직 관계 시드 시작...");

  const userRepository = dataSource.getRepository(User);
  const organizationRepository = dataSource.getRepository(Organization);
  const userOrganizationRepository = dataSource.getRepository(UserOrganization);

  // 기존 관계 데이터 확인
  const existingRelationsCount = await userOrganizationRepository.count();
  if (existingRelationsCount > 0) {
    console.log(
      `⚠️  이미 ${existingRelationsCount}개의 사용자-조직 관계가 존재합니다. 시드를 건너뜁니다.`
    );
    return;
  }

  try {
    // 사용자 및 조직 데이터 가져오기
    const users = await userRepository.find();
    const organizations = await organizationRepository.find({
      order: { priority: "ASC" },
    });

    if (users.length === 0) {
      throw new Error(
        "사용자 데이터가 없습니다. 먼저 사용자 시드를 실행해주세요."
      );
    }

    if (organizations.length === 0) {
      throw new Error("조직 데이터가 없습니다. 먼저 조직 시드를 실행해주세요.");
    }

    // 특정 사용자 조회 헬퍼
    const findUser = (email: string) =>
      users.find((user) => user.email === email);
    const findOrg = (name: string) =>
      organizations.find((org) => org.name === name);

    const userOrganizations = [];

    // 1. 시스템 관리자 - 모든 조직에 ADMIN 권한
    const superAdmin = findUser("admin@church.org");
    if (superAdmin) {
      for (const org of organizations) {
        const superAdminRelation = userOrganizationRepository.create({
          userId: superAdmin.id,
          organizationId: org.id,
          role: OrganizationRole.ADMIN,
          status: MembershipStatus.ACTIVE,
          joinedAt: new Date(),
          roleChangedAt: new Date(),
          approvedBy: superAdmin.id, // 자신이 승인
          approvedAt: new Date(),
          permissions: {
            canViewBudgets: true,
            canCreateBudgets: true,
            canApproveBudgets: true,
            canViewSettlements: true,
            canCreateSettlements: true,
            canApproveSettlements: true,
            canManageEvents: true,
            canManageMembers: true,
            canViewReports: true,
            canExportData: true,
          },
          notes: `시스템 관리자로서 ${org.name}에 대한 모든 권한을 보유합니다.`,
          isActive: true,
        });
        userOrganizations.push(superAdminRelation);
      }
    }

    // 2. 조직별 관리자 - 해당 조직에만 ADMIN 권한
    const orgAdminMappings = [
      { email: "youth-admin@church.org", orgName: "청년회" },
      { email: "mothers-admin@church.org", orgName: "자모회" },
      { email: "elementary-admin@church.org", orgName: "초등부 주일학교" },
      { email: "youth-school-admin@church.org", orgName: "중고등부 주일학교" },
    ];

    for (const mapping of orgAdminMappings) {
      const user = findUser(mapping.email);
      const org = findOrg(mapping.orgName);

      if (user && org) {
        const orgAdminRelation = userOrganizationRepository.create({
          userId: user.id,
          organizationId: org.id,
          role: OrganizationRole.ADMIN,
          status: MembershipStatus.ACTIVE,
          joinedAt: new Date(),
          roleChangedAt: new Date(),
          invitedBy: superAdmin?.id, // 시스템 관리자가 초대
          approvedBy: superAdmin?.id,
          approvedAt: new Date(),
          permissions: {
            canViewBudgets: true,
            canCreateBudgets: true,
            canApproveBudgets: true,
            canViewSettlements: true,
            canCreateSettlements: true,
            canApproveSettlements: true,
            canManageEvents: true,
            canManageMembers: true,
            canViewReports: true,
            canExportData: true,
          },
          notes: `${org.name} 조직 관리자로서 모든 권한을 보유합니다.`,
          isActive: true,
        });
        userOrganizations.push(orgAdminRelation);
      }
    }

    // 3. 회계 담당자 - 모든 조직에 TREASURER 권한
    const treasurer = findUser("treasurer@church.org");
    if (treasurer) {
      for (const org of organizations) {
        const treasurerRelation = userOrganizationRepository.create({
          userId: treasurer.id,
          organizationId: org.id,
          role: OrganizationRole.TREASURER,
          status: MembershipStatus.ACTIVE,
          joinedAt: new Date(),
          roleChangedAt: new Date(),
          invitedBy: superAdmin?.id,
          approvedBy: superAdmin?.id,
          approvedAt: new Date(),
          permissions: {
            canViewBudgets: true,
            canCreateBudgets: true,
            canApproveBudgets: true,
            canViewSettlements: true,
            canCreateSettlements: true,
            canApproveSettlements: true,
            canManageEvents: false,
            canManageMembers: false,
            canViewReports: true,
            canExportData: true,
          },
          notes: `${org.name}의 회계 담당자로서 재정 관련 모든 권한을 보유합니다.`,
          isActive: true,
        });
        userOrganizations.push(treasurerRelation);
      }
    }

    // 4. 회계담당자 - 모든 조직에 ACCOUNTANT 권한
    const accountant = findUser("accountant@church.org");
    if (accountant) {
      for (const org of organizations) {
        const accountantRelation = userOrganizationRepository.create({
          userId: accountant.id,
          organizationId: org.id,
          role: OrganizationRole.ACCOUNTANT,
          status: MembershipStatus.ACTIVE,
          joinedAt: new Date(),
          roleChangedAt: new Date(),
          invitedBy: superAdmin?.id,
          approvedBy: superAdmin?.id,
          approvedAt: new Date(),
          permissions: {
            canViewBudgets: true,
            canCreateBudgets: true,
            canApproveBudgets: false, // 회계담당자는 승인 권한 없음
            canViewSettlements: true,
            canCreateSettlements: true,
            canApproveSettlements: false, // 회계담당자는 승인 권한 없음
            canManageEvents: false,
            canManageMembers: false,
            canViewReports: true,
            canExportData: false,
          },
          notes: `${org.name}의 회계 업무 담당자로서 예산 작성 및 정산 권한을 보유합니다.`,
          isActive: true,
        });
        userOrganizations.push(accountantRelation);
      }
    }

    // 사용자-조직 관계 저장
    await userOrganizationRepository.save(userOrganizations);

    // 조직별 통계 업데이트
    for (const org of organizations) {
      const memberCount = userOrganizations.filter(
        (uo) =>
          uo.organizationId === org.id && uo.status === MembershipStatus.ACTIVE
      ).length;

      org.updateStatistics({
        totalMembers: memberCount,
        lastActivityAt: new Date(),
      });
    }
    await organizationRepository.save(organizations);

    console.log(
      `✅ ${userOrganizations.length}개의 사용자-조직 관계가 생성되었습니다:`
    );

    // 조직별 멤버 현황 출력
    for (const org of organizations) {
      const orgMembers = userOrganizations.filter(
        (uo) => uo.organizationId === org.id
      );
      console.log(`\n   📋 ${org.name} (${orgMembers.length}명):`);

      for (const relation of orgMembers) {
        const user = users.find((u) => u.id === relation.userId);
        if (user) {
          console.log(
            `      - ${user.name} (${user.email}) - ${relation.role}`
          );
        }
      }
    }
  } catch (error) {
    console.error("❌ 사용자-조직 관계 시드 데이터 생성 실패:", error);
    throw error;
  }
}
