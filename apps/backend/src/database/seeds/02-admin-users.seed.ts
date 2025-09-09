/* eslint-disable no-console */
import { DataSource } from "typeorm";
import * as bcrypt from "bcrypt";
import { User, UserRole, UserStatus } from "../../entities/user.entity";
import { Organization } from "../../entities/organization.entity";

/**
 * 관리자 사용자 계정 시드
 * Task 2.10: 시스템 관리자 및 각 조직별 관리자 계정 생성
 */
export async function seedAdminUsers(dataSource: DataSource): Promise<void> {
  console.log("🌱 관리자 사용자 계정 시드 시작...");

  const userRepository = dataSource.getRepository(User);
  const organizationRepository = dataSource.getRepository(Organization);

  // 기존 사용자 데이터 확인
  const existingUsersCount = await userRepository.count();
  if (existingUsersCount > 0) {
    console.log(
      `⚠️  이미 ${existingUsersCount}명의 사용자가 존재합니다. 시드를 건너뜁니다.`
    );
    return;
  }

  // 기본 패스워드 해시 생성 (운영환경에서는 반드시 변경 필요!)
  const defaultPassword = "Password123!";
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

  try {
    // 조직 정보 가져오기 (조직별 관리자 생성을 위해)
    const organizations = await organizationRepository.find({
      order: { priority: "ASC" },
    });

    if (organizations.length === 0) {
      throw new Error("조직 데이터가 없습니다. 먼저 조직 시드를 실행해주세요.");
    }

    const adminUsers = [];

    // 1. 시스템 최고 관리자 (SUPER_ADMIN)
    const superAdmin = userRepository.create({
      email: "admin@church.org",
      passwordHash: hashedPassword,
      name: "시스템 관리자",
      phone: "010-9999-0000",
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      profileImageUrl: null,
      lastLoginAt: null,
      lastLoginIp: null,
      emailVerifiedAt: new Date(), // 이미 인증된 상태로 생성
      emailVerificationToken: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      isActive: true,
      notes: "시스템 전체 관리자 - 모든 조직에 대한 관리 권한을 가집니다.",
      preferences: {
        language: "ko",
        theme: "light",
        dateFormat: "YYYY-MM-DD",
        currency: "KRW",
        timezone: "Asia/Seoul",
        notifications: {
          email: true,
          push: true,
          budgetAlerts: true,
          systemAlerts: true,
        },
      },
    });
    adminUsers.push(superAdmin);

    // 2. 각 조직별 관리자 계정 생성
    const organizationAdmins = [
      {
        org: organizations.find((org) => org.name === "청년회"),
        email: "youth-admin@church.org",
        name: "청년회 관리자",
        phone: "010-1000-0001",
        notes: "청년회 조직 관리자 - 청년 활동 및 예산 관리를 담당합니다.",
      },
      {
        org: organizations.find((org) => org.name === "자모회"),
        email: "mothers-admin@church.org",
        name: "자모회 관리자",
        phone: "010-1000-0002",
        notes: "자모회 조직 관리자 - 자모회 활동 및 예산 관리를 담당합니다.",
      },
      {
        org: organizations.find((org) => org.name === "초등부 주일학교"),
        email: "elementary-admin@church.org",
        name: "초등부 관리자",
        phone: "010-1000-0003",
        notes: "초등부 조직 관리자 - 초등부 교육 및 예산 관리를 담당합니다.",
      },
      {
        org: organizations.find((org) => org.name === "중고등부 주일학교"),
        email: "youth-school-admin@church.org",
        name: "중고등부 관리자",
        phone: "010-1000-0004",
        notes:
          "중고등부 조직 관리자 - 중고등부 교육 및 예산 관리를 담당합니다.",
      },
    ];

    for (const adminData of organizationAdmins) {
      if (!adminData.org) {
        console.log(
          `⚠️  조직을 찾을 수 없어 관리자 생성을 건너뜁니다: ${adminData.name}`
        );
        continue;
      }

      const orgAdmin = userRepository.create({
        email: adminData.email,
        passwordHash: hashedPassword,
        name: adminData.name,
        phone: adminData.phone,
        role: UserRole.ORGANIZATION_ADMIN,
        status: UserStatus.ACTIVE,
        profileImageUrl: null,
        lastLoginAt: null,
        lastLoginIp: null,
        emailVerifiedAt: new Date(), // 이미 인증된 상태로 생성
        emailVerificationToken: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        isActive: true,
        notes: adminData.notes,
        preferences: {
          language: "ko",
          theme: "light",
          dateFormat: "YYYY-MM-DD",
          currency: "KRW",
          timezone: "Asia/Seoul",
          defaultOrganization: adminData.org.id,
          notifications: {
            email: true,
            push: true,
            budgetAlerts: true,
            systemAlerts: false,
          },
        },
      });

      adminUsers.push(orgAdmin);
    }

    // 3. 추가 역할별 관리자 계정
    const specialAdmins = [
      {
        email: "treasurer@church.org",
        name: "교회 회계",
        phone: "010-2000-0001",
        role: UserRole.TREASURER,
        notes: "교회 전체 회계 담당자 - 모든 조직의 재정 관리 권한을 가집니다.",
      },
      {
        email: "accountant@church.org",
        name: "회계담당자",
        phone: "010-2000-0002",
        role: UserRole.ACCOUNTANT,
        notes: "회계 업무 담당자 - 예산 작성 및 정산 업무를 수행합니다.",
      },
    ];

    for (const specialAdminData of specialAdmins) {
      const specialAdmin = userRepository.create({
        ...specialAdminData,
        passwordHash: hashedPassword,
        status: UserStatus.ACTIVE,
        profileImageUrl: null,
        lastLoginAt: null,
        lastLoginIp: null,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        isActive: true,
        preferences: {
          language: "ko",
          theme: "light",
          dateFormat: "YYYY-MM-DD",
          currency: "KRW",
          timezone: "Asia/Seoul",
          notifications: {
            email: true,
            push: true,
            budgetAlerts: true,
            systemAlerts: true,
          },
        },
      });

      adminUsers.push(specialAdmin);
    }

    // 사용자 계정 저장
    await userRepository.save(adminUsers);

    console.log(`✅ ${adminUsers.length}명의 관리자 계정이 생성되었습니다:`);
    adminUsers.forEach((user) => {
      console.log(`   - ${user.name} (${user.email}) - ${user.role}`);
    });

    console.log(
      `\n⚠️  보안 경고: 기본 패스워드는 '${defaultPassword}' 입니다.`
    );
    console.log("   운영 환경에서는 반드시 패스워드를 변경해주세요!");
  } catch (error) {
    console.error("❌ 관리자 계정 시드 데이터 생성 실패:", error);
    throw error;
  }
}
