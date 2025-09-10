/* eslint-disable no-console */
import { DataSource } from "typeorm";
import * as bcrypt from "bcrypt";
import { User, UserRole, UserStatus } from "../../entities/user.entity";
import { Organization } from "../../entities/organization.entity";

/**
 * 개발용 테스트 사용자 계정 시드
 * Task 2.11: 단체별 다양한 역할의 테스트 사용자 계정 생성
 *
 * 생성되는 계정:
 * - 청년회 회원들 (일반회원, 총무, 회장)
 * - 자모회 회원들 (일반회원, 총무)
 * - 초등부 회원들 (교사, 담당자)
 * - 중고등부 회원들 (교사, 담당자)
 */
export async function seedTestUsers(dataSource: DataSource): Promise<void> {
  console.log("🌱 테스트 사용자 계정 시드 시작...");

  const userRepository = dataSource.getRepository(User);
  const organizationRepository = dataSource.getRepository(Organization);

  // 기존 테스트 사용자 확인 (이메일에 'test'가 포함된 사용자들)
  const existingTestUsers = await userRepository
    .createQueryBuilder("user")
    .where("user.email LIKE '%test%'")
    .getCount();

  if (existingTestUsers > 0) {
    console.log(
      `⚠️  이미 ${existingTestUsers}명의 테스트 사용자가 존재합니다. 시드를 건너뜁니다.`
    );
    return;
  }

  // 기본 패스워드 해시 생성 (개발용)
  const defaultPassword = "Test123!";
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

  try {
    // 조직 정보 가져오기
    const organizations = await organizationRepository.find({
      order: { priority: "ASC" },
    });

    if (organizations.length === 0) {
      throw new Error("조직 데이터가 없습니다. 먼저 조직 시드를 실행해주세요.");
    }

    const youthGroup = organizations.find((org) => org.name === "청년회");
    const mothersGroup = organizations.find((org) => org.name === "자모회");
    const elementarySchool = organizations.find(
      (org) => org.name === "초등부 주일학교"
    );
    const youthSchool = organizations.find(
      (org) => org.name === "중고등부 주일학교"
    );

    const testUsers = [];

    // 1. 청년회 테스트 사용자들
    if (youthGroup) {
      const youthUsers = [
        {
          email: "youth.president.test@church.org",
          name: "김청년",
          phone: "010-1111-0001",
          role: UserRole.MEMBER,
          notes: "청년회 회장 - 리더십과 행사 기획을 담당합니다.",
          organizationNotes: "청년회 회장으로 전체 활동을 총괄합니다.",
        },
        {
          email: "youth.treasurer.test@church.org",
          name: "이총무",
          phone: "010-1111-0002",
          role: UserRole.MEMBER,
          notes: "청년회 총무 - 예산 관리와 회계를 담당합니다.",
          organizationNotes: "청년회 총무로 재정 관리를 담당합니다.",
        },
        {
          email: "youth.member1.test@church.org",
          name: "박청년",
          phone: "010-1111-0003",
          role: UserRole.MEMBER,
          notes: "청년회 일반 회원 - 적극적으로 활동에 참여합니다.",
          organizationNotes: "청년회 일반 회원입니다.",
        },
        {
          email: "youth.member2.test@church.org",
          name: "최청년",
          phone: "010-1111-0004",
          role: UserRole.MEMBER,
          notes: "청년회 일반 회원 - 찬양팀에서 활동합니다.",
          organizationNotes: "청년회 찬양팀 회원입니다.",
        },
        {
          email: "youth.member3.test@church.org",
          name: "정청년",
          phone: "010-1111-0005",
          role: UserRole.MEMBER,
          notes: "청년회 신입 회원 - 최근에 등록한 새 멤버입니다.",
          organizationNotes: "청년회 신입 회원입니다.",
        },
      ];

      youthUsers.forEach((userData) => {
        testUsers.push(
          userRepository.create({
            ...userData,
            passwordHash: hashedPassword,
            status: UserStatus.ACTIVE,
            emailVerifiedAt: new Date(),
            isActive: true,
            preferences: {
              language: "ko",
              theme: "light",
              dateFormat: "YYYY-MM-DD",
              currency: "KRW",
              timezone: "Asia/Seoul",
              defaultOrganization: youthGroup.id,
              notifications: {
                email: true,
                push: true,
                budgetAlerts: true,
                systemAlerts: false,
              },
            },
          })
        );
      });
    }

    // 2. 자모회 테스트 사용자들
    if (mothersGroup) {
      const mothersUsers = [
        {
          email: "mothers.president.test@church.org",
          name: "김어머니",
          phone: "010-2222-0001",
          role: UserRole.MEMBER,
          notes: "자모회 회장 - 자모회 전체 활동을 총괄합니다.",
          organizationNotes: "자모회 회장으로 모든 활동을 이끌어갑니다.",
        },
        {
          email: "mothers.treasurer.test@church.org",
          name: "이자모",
          phone: "010-2222-0002",
          role: UserRole.MEMBER,
          notes: "자모회 총무 - 예산과 회계를 관리합니다.",
          organizationNotes: "자모회 총무로 재정을 관리합니다.",
        },
        {
          email: "mothers.member1.test@church.org",
          name: "박자모",
          phone: "010-2222-0003",
          role: UserRole.MEMBER,
          notes: "자모회 일반 회원 - 봉사 활동에 열심입니다.",
          organizationNotes: "자모회 일반 회원입니다.",
        },
        {
          email: "mothers.member2.test@church.org",
          name: "최자모",
          phone: "010-2222-0004",
          role: UserRole.MEMBER,
          notes: "자모회 일반 회원 - 요리 봉사를 담당합니다.",
          organizationNotes: "자모회 요리 봉사팀 회원입니다.",
        },
      ];

      mothersUsers.forEach((userData) => {
        testUsers.push(
          userRepository.create({
            ...userData,
            passwordHash: hashedPassword,
            status: UserStatus.ACTIVE,
            emailVerifiedAt: new Date(),
            isActive: true,
            preferences: {
              language: "ko",
              theme: "light",
              dateFormat: "YYYY-MM-DD",
              currency: "KRW",
              timezone: "Asia/Seoul",
              defaultOrganization: mothersGroup.id,
              notifications: {
                email: true,
                push: false,
                budgetAlerts: true,
                systemAlerts: false,
              },
            },
          })
        );
      });
    }

    // 3. 초등부 테스트 사용자들
    if (elementarySchool) {
      const elementaryUsers = [
        {
          email: "elementary.leader.test@church.org",
          name: "김초등",
          phone: "010-3333-0001",
          role: UserRole.MEMBER,
          notes: "초등부 부장 - 초등부 전체 교육을 담당합니다.",
          organizationNotes: "초등부 부장으로 교육과정을 총괄합니다.",
        },
        {
          email: "elementary.teacher1.test@church.org",
          name: "이선생",
          phone: "010-3333-0002",
          role: UserRole.MEMBER,
          notes: "초등부 교사 - 1-2학년 담임을 맡고 있습니다.",
          organizationNotes: "초등부 1-2학년 담임 교사입니다.",
        },
        {
          email: "elementary.teacher2.test@church.org",
          name: "박선생",
          phone: "010-3333-0003",
          role: UserRole.MEMBER,
          notes: "초등부 교사 - 3-4학년 담임을 맡고 있습니다.",
          organizationNotes: "초등부 3-4학년 담임 교사입니다.",
        },
      ];

      elementaryUsers.forEach((userData) => {
        testUsers.push(
          userRepository.create({
            ...userData,
            passwordHash: hashedPassword,
            status: UserStatus.ACTIVE,
            emailVerifiedAt: new Date(),
            isActive: true,
            preferences: {
              language: "ko",
              theme: "light",
              dateFormat: "YYYY-MM-DD",
              currency: "KRW",
              timezone: "Asia/Seoul",
              defaultOrganization: elementarySchool.id,
              notifications: {
                email: true,
                push: true,
                budgetAlerts: true,
                systemAlerts: false,
              },
            },
          })
        );
      });
    }

    // 4. 중고등부 테스트 사용자들
    if (youthSchool) {
      const youthSchoolUsers = [
        {
          email: "youthschool.leader.test@church.org",
          name: "김중등",
          phone: "010-4444-0001",
          role: UserRole.MEMBER,
          notes: "중고등부 부장 - 청소년 교육을 총괄합니다.",
          organizationNotes: "중고등부 부장으로 청소년 교육을 담당합니다.",
        },
        {
          email: "youthschool.teacher1.test@church.org",
          name: "이교사",
          phone: "010-4444-0002",
          role: UserRole.MEMBER,
          notes: "중고등부 교사 - 중등부 담임을 맡고 있습니다.",
          organizationNotes: "중등부 담임 교사입니다.",
        },
        {
          email: "youthschool.teacher2.test@church.org",
          name: "박교사",
          phone: "010-4444-0003",
          role: UserRole.MEMBER,
          notes: "중고등부 교사 - 고등부 담임을 맡고 있습니다.",
          organizationNotes: "고등부 담임 교사입니다.",
        },
      ];

      youthSchoolUsers.forEach((userData) => {
        testUsers.push(
          userRepository.create({
            ...userData,
            passwordHash: hashedPassword,
            status: UserStatus.ACTIVE,
            emailVerifiedAt: new Date(),
            isActive: true,
            preferences: {
              language: "ko",
              theme: "light",
              dateFormat: "YYYY-MM-DD",
              currency: "KRW",
              timezone: "Asia/Seoul",
              defaultOrganization: youthSchool.id,
              notifications: {
                email: true,
                push: true,
                budgetAlerts: true,
                systemAlerts: false,
              },
            },
          })
        );
      });
    }

    // 5. 다양한 상태의 테스트 사용자들 (테스트용)
    const specialTestUsers = [
      {
        email: "inactive.test@church.org",
        name: "비활성사용자",
        phone: "010-9999-0001",
        role: UserRole.MEMBER,
        status: UserStatus.INACTIVE,
        notes: "비활성 상태 테스트용 계정입니다.",
        isActive: false,
      },
      {
        email: "pending.test@church.org",
        name: "미인증사용자",
        phone: "010-9999-0002",
        role: UserRole.MEMBER,
        status: UserStatus.PENDING_VERIFICATION,
        notes: "이메일 미인증 상태 테스트용 계정입니다.",
        emailVerifiedAt: undefined,
      },
      {
        email: "guest.test@church.org",
        name: "게스트사용자",
        phone: "010-9999-0003",
        role: UserRole.GUEST,
        status: UserStatus.ACTIVE,
        notes: "게스트 권한 테스트용 계정입니다.",
        emailVerifiedAt: new Date(),
      },
    ];

    specialTestUsers.forEach((userData) => {
      testUsers.push(
        userRepository.create({
          ...userData,
          passwordHash: hashedPassword,
          isActive: userData.isActive ?? true,
          preferences: {
            language: "ko",
            theme: "light",
            dateFormat: "YYYY-MM-DD",
            currency: "KRW",
            timezone: "Asia/Seoul",
            notifications: {
              email: false,
              push: false,
              budgetAlerts: false,
              systemAlerts: false,
            },
          },
        })
      );
    });

    // 사용자 계정 저장
    await userRepository.save(testUsers);

    console.log(`✅ ${testUsers.length}명의 테스트 사용자가 생성되었습니다:`);

    // 조직별로 그룹화하여 출력
    const orgGroups = {
      청년회: testUsers.filter(
        (u) => u.preferences?.defaultOrganization === youthGroup?.id
      ).length,
      자모회: testUsers.filter(
        (u) => u.preferences?.defaultOrganization === mothersGroup?.id
      ).length,
      초등부: testUsers.filter(
        (u) => u.preferences?.defaultOrganization === elementarySchool?.id
      ).length,
      중고등부: testUsers.filter(
        (u) => u.preferences?.defaultOrganization === youthSchool?.id
      ).length,
      기타: specialTestUsers.length,
    };

    Object.entries(orgGroups).forEach(([org, count]) => {
      if (count > 0) {
        console.log(`   - ${org}: ${count}명`);
      }
    });

    console.log(`\n⚠️  테스트 계정 정보:`);
    console.log(`   - 기본 패스워드: '${defaultPassword}'`);
    console.log(`   - 모든 테스트 이메일에는 'test'가 포함되어 있습니다.`);
    console.log(`   - 각 조직별로 다양한 역할의 사용자가 생성되었습니다.`);
  } catch (error) {
    console.error("❌ 테스트 사용자 시드 데이터 생성 실패:", error);
    throw error;
  }
}
