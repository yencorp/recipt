import { Injectable, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User, UserRole, UserStatus } from "../../entities/user.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async findAll() {
    // TODO: 페이징, 필터링, 정렬 기능 구현
    return this.userRepository.find({
      select: ["id", "email", "name", "role", "status", "createdAt"],
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ["userOrganizations", "userOrganizations.organization"],
    });

    if (!user) {
      throw new Error("사용자를 찾을 수 없습니다.");
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ["userOrganizations", "userOrganizations.organization"],
    });
  }

  async create(userData: {
    email: string;
    passwordHash: string;
    name: string;
    phone?: string;
    role?: UserRole;
  }): Promise<User> {
    // 이메일 중복 확인
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictException("이미 사용 중인 이메일 주소입니다.");
    }

    // 사용자 생성
    const user = this.userRepository.create({
      email: userData.email,
      passwordHash: userData.passwordHash,
      name: userData.name,
      phone: userData.phone,
      role: userData.role || UserRole.MEMBER,
      status: UserStatus.PENDING_VERIFICATION,
      isActive: true,
      failedLoginAttempts: 0,
    });

    return this.userRepository.save(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, {
      lastLoginAt: new Date(),
    });
  }

  async update(id: string, updateUserDto: any) {
    // TODO: DTO 유효성 검증 구현
    await this.findOne(id);

    await this.userRepository.update(id, updateUserDto);
    return this.findOne(id);
  }
}
