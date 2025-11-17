/* eslint-disable no-console */
import { DataSource } from "typeorm";
import {
  Event,
  EventType,
  EventStatus,
  EventVisibility,
} from "../../entities/event.entity";
import { Organization } from "../../entities/organization.entity";
import { User } from "../../entities/user.entity";

/**
 * 샘플 행사 데이터 시드
 * Task 2.11: 각 조직별 다양한 유형의 샘플 행사 데이터 생성
 *
 * 생성되는 행사들:
 * - 청년회: 수련회, 정기모임, 봉사활동, 특별행사
 * - 자모회: 기도회, 친교행사, 봉사활동
 * - 초등부: 교육행사, 체험활동, 특별행사
 * - 중고등부: 수련회, 교육행사, 진로멘토링
 */
export async function seedSampleEvents(dataSource: DataSource): Promise<void> {
  console.log("🌱 샘플 행사 데이터 시드 시작...");

  const eventRepository = dataSource.getRepository(Event);
  const organizationRepository = dataSource.getRepository(Organization);
  const userRepository = dataSource.getRepository(User);

  // 기존 행사 데이터 확인
  const existingEventsCount = await eventRepository.count();
  if (existingEventsCount > 0) {
    console.log(
      `⚠️  이미 ${existingEventsCount}개의 행사가 존재합니다. 시드를 건너뜁니다.`
    );
    return;
  }

  try {
    // 조직 및 사용자 정보 가져오기
    const organizations = await organizationRepository.find({
      order: { priority: "ASC" },
    });

    const testUsers = await userRepository.find({
      where: { isActive: true },
    });

    if (organizations.length === 0) {
      throw new Error("조직 데이터가 없습니다. 먼저 조직 시드를 실행해주세요.");
    }

    if (testUsers.length === 0) {
      throw new Error(
        "사용자 데이터가 없습니다. 먼저 사용자 시드를 실행해주세요."
      );
    }

    const youthGroup = organizations.find((org) => org.name === "청년회");
    const mothersGroup = organizations.find((org) => org.name === "자모회");
    const elementarySchool = organizations.find(
      (org) => org.name === "초등부 주일학교"
    );
    const youthSchool = organizations.find(
      (org) => org.name === "중고등부 주일학교"
    );

    // 조직별 사용자 찾기 (생성자로 사용)
    const getOrgUser = (orgId: string) => {
      return (
        testUsers.find((u) => u.preferences?.defaultOrganization === orgId) ||
        testUsers[0]
      );
    };

    const sampleEvents = [];

    // 1. 청년회 행사들
    if (youthGroup) {
      const youthCreator = getOrgUser(youthGroup.id);
      const youthEvents = [
        {
          organizationId: youthGroup.id,
          createdById: youthCreator.id,
          title: "2024년 청년 수련회",
          description:
            "매년 열리는 청년회 대표 행사로, 영성 성장과 친교를 통해 청년들의 신앙 성숙을 도모합니다.",
          type: EventType.RETREAT,
          status: EventStatus.COMPLETED,
          visibility: EventVisibility.MEMBERS_ONLY,
          startDate: new Date("2024-08-15"),
          endDate: new Date("2024-08-17"),
          startTime: "14:00",
          endTime: "16:00",
          location: "청평수양관",
          locationDetails: "경기도 가평군 청평면 청평호로 123",
          estimatedCost: 150000,
          maxParticipants: 50,
          currentParticipants: 45,
          currency: "KRW",
          responsiblePerson: "김청년",
          responsibleContact: "010-1111-0001",
          metadata: {
            tags: ["수련회", "청년", "영성", "친교"],
            categories: ["신앙성장", "공동체"],
            requirements: ["침낭", "세면도구", "성경책", "찬양책"],
            materials: ["워크북", "필기도구"],
            agenda: [
              {
                time: "14:00",
                title: "개회예배",
                description: "수련회 시작 예배",
                speaker: "담당 목사",
              },
              {
                time: "15:30",
                title: "첫 번째 강의",
                description: "청년의 신앙과 소명",
                speaker: "강사 목사",
              },
              {
                time: "19:00",
                title: "찬양과 교제의 시간",
                description: "자유로운 찬양과 간증 시간",
              },
            ],
          },
          notes:
            "성공적으로 마무리된 수련회로, 참가자들의 만족도가 매우 높았습니다.",
          isActive: true,
        },
        {
          organizationId: youthGroup.id,
          createdById: youthCreator.id,
          title: "청년 정기 모임",
          description: "매월 첫째 주 토요일에 진행되는 청년회 정기 모임입니다.",
          type: EventType.REGULAR,
          status: EventStatus.APPROVED,
          visibility: EventVisibility.MEMBERS_ONLY,
          startDate: new Date("2024-12-07"),
          endDate: new Date("2024-12-07"),
          startTime: "19:00",
          endTime: "21:00",
          location: "교회 본당 2층 청년실",
          estimatedCost: 10000,
          maxParticipants: 30,
          currentParticipants: 12,
          currency: "KRW",
          responsiblePerson: "김청년",
          responsibleContact: "010-1111-0001",
          metadata: {
            tags: ["정기모임", "청년", "교제"],
            categories: ["정기행사", "친교"],
            agenda: [
              {
                time: "19:00",
                title: "개회 기도",
                description: "시작 기도",
              },
              {
                time: "19:30",
                title: "말씀 나눔",
                description: "이번 달 성경 구절 나눔",
              },
              {
                time: "20:30",
                title: "친교 시간",
                description: "간단한 다과와 함께하는 교제",
              },
            ],
          },
          notes: "매월 정기적으로 진행되는 모임입니다.",
          isActive: true,
        },
        {
          organizationId: youthGroup.id,
          createdById: youthCreator.id,
          title: "독거노인 봉사활동",
          description: "지역 독거노인 분들을 위한 봉사활동을 진행합니다.",
          type: EventType.SERVICE,
          status: EventStatus.PLANNED,
          visibility: EventVisibility.PUBLIC,
          startDate: new Date("2024-12-21"),
          endDate: new Date("2024-12-21"),
          startTime: "10:00",
          endTime: "16:00",
          location: "광남동 일대",
          locationDetails: "광남동 독거노인 가정 방문",
          estimatedCost: 50000,
          maxParticipants: 20,
          currentParticipants: 8,
          currency: "KRW",
          responsiblePerson: "이총무",
          responsibleContact: "010-1111-0002",
          metadata: {
            tags: ["봉사", "독거노인", "지역사회"],
            categories: ["봉사활동", "사회참여"],
            requirements: ["편한 복장", "마스크"],
            materials: ["생필품", "도시락"],
          },
          notes: "지역 사회에 도움이 되는 의미 있는 봉사활동입니다.",
          isActive: true,
        },
        {
          organizationId: youthGroup.id,
          createdById: youthCreator.id,
          title: "청년 송년회",
          description:
            "2024년을 마무리하고 2025년을 준비하는 청년회 송년 모임입니다.",
          type: EventType.SPECIAL,
          status: EventStatus.DRAFT,
          visibility: EventVisibility.MEMBERS_ONLY,
          startDate: new Date("2024-12-28"),
          endDate: new Date("2024-12-28"),
          startTime: "18:00",
          endTime: "22:00",
          location: "교회 교육관 대강당",
          estimatedCost: 80000,
          maxParticipants: 60,
          currentParticipants: 0,
          currency: "KRW",
          responsiblePerson: "박청년",
          responsibleContact: "010-1111-0003",
          metadata: {
            tags: ["송년회", "친교", "감사"],
            categories: ["특별행사", "친교"],
            requirements: ["정장 차림"],
          },
          notes: "아직 계획 단계인 송년회입니다.",
          isActive: true,
        },
      ];

      youthEvents.forEach((eventData) => {
        sampleEvents.push(eventRepository.create(eventData));
      });
    }

    // 2. 자모회 행사들
    if (mothersGroup) {
      const mothersCreator = getOrgUser(mothersGroup.id);
      const mothersEvents = [
        {
          organizationId: mothersGroup.id,
          createdById: mothersCreator.id,
          title: "새벽 기도회",
          description: "매주 수요일 새벽에 진행되는 자모회 기도 모임입니다.",
          type: EventType.WORSHIP,
          status: EventStatus.APPROVED,
          visibility: EventVisibility.MEMBERS_ONLY,
          startDate: new Date("2024-12-11"),
          endDate: new Date("2024-12-11"),
          startTime: "05:30",
          endTime: "06:30",
          location: "교회 본당 1층 자모실",
          estimatedCost: 0,
          maxParticipants: null,
          currentParticipants: 15,
          currency: "KRW",
          responsiblePerson: "김어머니",
          responsibleContact: "010-2222-0001",
          metadata: {
            tags: ["새벽기도", "예배", "기도"],
            categories: ["정기행사", "예배"],
          },
          notes: "매주 정기적으로 진행되는 새벽 기도회입니다.",
          isActive: true,
        },
        {
          organizationId: mothersGroup.id,
          createdById: mothersCreator.id,
          title: "자모회 친교 모임",
          description: "자모회 회원들 간의 친목을 도모하는 월례 모임입니다.",
          type: EventType.FELLOWSHIP,
          status: EventStatus.IN_PROGRESS,
          visibility: EventVisibility.MEMBERS_ONLY,
          startDate: new Date("2024-12-14"),
          endDate: new Date("2024-12-14"),
          startTime: "14:00",
          endTime: "17:00",
          location: "교회 교육관 1층 다목적실",
          estimatedCost: 30000,
          maxParticipants: 25,
          currentParticipants: 20,
          currency: "KRW",
          responsiblePerson: "이자모",
          responsibleContact: "010-2222-0002",
          metadata: {
            tags: ["친교", "모임", "어머니"],
            categories: ["친교", "정기행사"],
            materials: ["다과", "간식"],
          },
          notes: "현재 진행 중인 친교 모임입니다.",
          isActive: true,
        },
        {
          organizationId: mothersGroup.id,
          createdById: mothersCreator.id,
          title: "김장 나눔 봉사",
          description: "어려운 이웃을 위한 김장 담그기 봉사활동입니다.",
          type: EventType.SERVICE,
          status: EventStatus.COMPLETED,
          visibility: EventVisibility.PUBLIC,
          startDate: new Date("2024-11-30"),
          endDate: new Date("2024-11-30"),
          startTime: "09:00",
          endTime: "15:00",
          location: "교회 교육관 식당",
          estimatedCost: 200000,
          maxParticipants: 30,
          currentParticipants: 28,
          currency: "KRW",
          responsiblePerson: "최자모",
          responsibleContact: "010-2222-0004",
          metadata: {
            tags: ["김장", "봉사", "나눔"],
            categories: ["봉사활동", "사회참여"],
            materials: ["배추", "양념", "용기", "앞치마"],
          },
          notes: "성공적으로 완료된 김장 나눔 봉사활동입니다.",
          isActive: true,
        },
      ];

      mothersEvents.forEach((eventData) => {
        sampleEvents.push(eventRepository.create(eventData));
      });
    }

    // 3. 초등부 행사들
    if (elementarySchool) {
      const elementaryCreator = getOrgUser(elementarySchool.id);
      const elementaryEvents = [
        {
          organizationId: elementarySchool.id,
          createdById: elementaryCreator.id,
          title: "여름 성경학교",
          description: "초등학생들을 위한 여름 성경학교 프로그램입니다.",
          type: EventType.EDUCATION,
          status: EventStatus.COMPLETED,
          visibility: EventVisibility.PUBLIC,
          startDate: new Date("2024-08-05"),
          endDate: new Date("2024-08-09"),
          startTime: "09:00",
          endTime: "12:00",
          location: "교회 교육관 1층 초등부실",
          estimatedCost: 100000,
          maxParticipants: 40,
          currentParticipants: 35,
          currency: "KRW",
          responsiblePerson: "김초등",
          responsibleContact: "010-3333-0001",
          metadata: {
            tags: ["성경학교", "초등부", "교육", "여름"],
            categories: ["교육", "특별행사"],
            requirements: ["성경책", "필기도구", "간식"],
            materials: ["교재", "만들기 재료", "상품"],
          },
          notes: "아이들이 즐겁게 참여한 성경학교였습니다.",
          isActive: true,
        },
        {
          organizationId: elementarySchool.id,
          createdById: elementaryCreator.id,
          title: "체험학습 - 자연 속에서 하나님 만나기",
          description: "자연 속에서 하나님의 창조를 체험하는 야외 학습입니다.",
          type: EventType.EDUCATION,
          status: EventStatus.APPROVED,
          visibility: EventVisibility.PUBLIC,
          startDate: new Date("2024-12-20"),
          endDate: new Date("2024-12-20"),
          startTime: "10:00",
          endTime: "16:00",
          location: "남한산성 도립공원",
          locationDetails: "경기도 광주시 남한산성면",
          estimatedCost: 25000,
          maxParticipants: 30,
          currentParticipants: 18,
          currency: "KRW",
          responsiblePerson: "이선생",
          responsibleContact: "010-3333-0002",
          metadata: {
            tags: ["체험학습", "자연", "창조", "야외활동"],
            categories: ["교육", "체험활동"],
            requirements: ["편한 복장", "운동화", "도시락", "물통"],
            materials: ["관찰 기록지", "색연필", "돋보기"],
          },
          notes: "자연을 통해 하나님의 창조를 경험하는 소중한 시간입니다.",
          isActive: true,
        },
        {
          organizationId: elementarySchool.id,
          createdById: elementaryCreator.id,
          title: "초등부 크리스마스 발표회",
          description: "아이들이 준비한 크리스마스 특별 발표회입니다.",
          type: EventType.SPECIAL,
          status: EventStatus.PLANNED,
          visibility: EventVisibility.PUBLIC,
          startDate: new Date("2024-12-22"),
          endDate: new Date("2024-12-22"),
          startTime: "15:00",
          endTime: "17:00",
          location: "교회 본당",
          estimatedCost: 50000,
          maxParticipants: null,
          currentParticipants: 35,
          currency: "KRW",
          responsiblePerson: "박선생",
          responsibleContact: "010-3333-0003",
          metadata: {
            tags: ["크리스마스", "발표회", "공연"],
            categories: ["특별행사", "공연"],
            materials: ["의상", "소품", "음향장비"],
          },
          notes: "아이들이 열심히 준비하고 있는 발표회입니다.",
          isActive: true,
        },
      ];

      elementaryEvents.forEach((eventData) => {
        sampleEvents.push(eventRepository.create(eventData));
      });
    }

    // 4. 중고등부 행사들
    if (youthSchool) {
      const youthSchoolCreator = getOrgUser(youthSchool.id);
      const youthSchoolEvents = [
        {
          organizationId: youthSchool.id,
          createdById: youthSchoolCreator.id,
          title: "중고등부 겨울 수련회",
          description: "청소년들의 신앙 성장을 위한 겨울 수련회입니다.",
          type: EventType.RETREAT,
          status: EventStatus.APPROVED,
          visibility: EventVisibility.MEMBERS_ONLY,
          startDate: new Date("2025-01-03"),
          endDate: new Date("2025-01-05"),
          startTime: "14:00",
          endTime: "15:00",
          location: "파라다이스 청소년 수련원",
          locationDetails: "강원도 평창군 대관령면",
          estimatedCost: 120000,
          maxParticipants: 35,
          currentParticipants: 22,
          currency: "KRW",
          responsiblePerson: "김중등",
          responsibleContact: "010-4444-0001",
          metadata: {
            tags: ["수련회", "중고등부", "청소년", "겨울"],
            categories: ["신앙성장", "공동체"],
            requirements: ["침낭", "세면도구", "성경책", "따뜻한 옷"],
            materials: ["워크북", "필기도구"],
          },
          notes: "청소년들의 신앙 성숙을 위한 중요한 행사입니다.",
          isActive: true,
        },
        {
          organizationId: youthSchool.id,
          createdById: youthSchoolCreator.id,
          title: "진로 멘토링 프로그램",
          description: "중고등학생들의 진로 탐색을 위한 멘토링 프로그램입니다.",
          type: EventType.EDUCATION,
          status: EventStatus.IN_PROGRESS,
          visibility: EventVisibility.MEMBERS_ONLY,
          startDate: new Date("2024-12-15"),
          endDate: new Date("2024-12-15"),
          startTime: "14:00",
          endTime: "17:00",
          location: "교회 교육관 2층 중고등부실",
          estimatedCost: 20000,
          maxParticipants: 25,
          currentParticipants: 20,
          currency: "KRW",
          responsiblePerson: "이교사",
          responsibleContact: "010-4444-0002",
          metadata: {
            tags: ["진로", "멘토링", "교육", "청소년"],
            categories: ["교육", "멘토링"],
            materials: ["진로 탐색지", "필기도구"],
          },
          notes: "현재 진행 중인 진로 멘토링 프로그램입니다.",
          isActive: true,
        },
      ];

      youthSchoolEvents.forEach((eventData) => {
        sampleEvents.push(eventRepository.create(eventData));
      });
    }

    // 행사 데이터 저장
    await eventRepository.save(sampleEvents);

    console.log(`✅ ${sampleEvents.length}개의 샘플 행사가 생성되었습니다:`);

    // 조직별로 그룹화하여 출력
    const orgEventCounts = {
      청년회: sampleEvents.filter((e) => e.organizationId === youthGroup?.id)
        .length,
      자모회: sampleEvents.filter((e) => e.organizationId === mothersGroup?.id)
        .length,
      초등부: sampleEvents.filter(
        (e) => e.organizationId === elementarySchool?.id
      ).length,
      중고등부: sampleEvents.filter((e) => e.organizationId === youthSchool?.id)
        .length,
    };

    Object.entries(orgEventCounts).forEach(([org, count]) => {
      if (count > 0) {
        console.log(`   - ${org}: ${count}개 행사`);
      }
    });

    // 상태별 통계
    const statusCounts = {
      완료: sampleEvents.filter((e) => e.status === EventStatus.COMPLETED)
        .length,
      승인됨: sampleEvents.filter((e) => e.status === EventStatus.APPROVED)
        .length,
      진행중: sampleEvents.filter((e) => e.status === EventStatus.IN_PROGRESS)
        .length,
      계획됨: sampleEvents.filter((e) => e.status === EventStatus.PLANNED)
        .length,
      초안: sampleEvents.filter((e) => e.status === EventStatus.DRAFT).length,
    };

    console.log(`\n📊 행사 상태별 통계:`);
    Object.entries(statusCounts).forEach(([status, count]) => {
      if (count > 0) {
        console.log(`   - ${status}: ${count}개`);
      }
    });
  } catch (error) {
    console.error("❌ 샘플 행사 시드 데이터 생성 실패:", error);
    throw error;
  }
}
