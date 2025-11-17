import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";
import { User, UserRole, UserStatus } from "../../entities/user.entity";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import * as bcrypt from "bcrypt";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService
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
      throw new NotFoundException("사용자를 찾을 수 없습니다.");
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

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id);

    // 실제 업데이트할 필드가 있는지 확인
    const fieldsToUpdate = Object.keys(updateUserDto).filter(
      (key) => updateUserDto[key] !== undefined
    );

    if (fieldsToUpdate.length === 0) {
      throw new BadRequestException("수정할 필드가 없습니다.");
    }

    await this.userRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto) {
    // 1. 비밀번호 확인 검증
    if (
      changePasswordDto.newPassword !== changePasswordDto.newPasswordConfirm
    ) {
      throw new BadRequestException("새 비밀번호가 일치하지 않습니다.");
    }

    // 2. 현재 비밀번호가 새 비밀번호와 동일한지 확인
    if (changePasswordDto.currentPassword === changePasswordDto.newPassword) {
      throw new BadRequestException(
        "새 비밀번호는 현재 비밀번호와 달라야 합니다."
      );
    }

    // 3. 사용자 조회
    const user = await this.userRepository.findOne({
      where: { id },
      select: ["id", "email", "passwordHash"],
    });

    if (!user) {
      throw new NotFoundException("사용자를 찾을 수 없습니다.");
    }

    // 4. 현재 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException("현재 비밀번호가 올바르지 않습니다.");
    }

    // 5. 새 비밀번호 해싱
    const saltRounds = parseInt(
      this.configService.get<string>("BCRYPT_SALT_ROUNDS", "10"),
      10
    );
    const newPasswordHash = await bcrypt.hash(
      changePasswordDto.newPassword,
      saltRounds
    );

    // 6. 비밀번호 업데이트
    await this.userRepository.update(id, {
      passwordHash: newPasswordHash,
    });

    return { message: "비밀번호가 성공적으로 변경되었습니다." };
  }

  async getUserOrganizations(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ["userOrganizations", "userOrganizations.organization"],
    });

    if (!user) {
      throw new NotFoundException("사용자를 찾을 수 없습니다.");
    }

    return user.userOrganizations.map((uo) => ({
      organizationId: uo.organization.id,
      organizationName: uo.organization.name,
      organizationType: uo.organization.type,
      joinedAt: uo.joinedAt,
      approve: uo.approve,
    }));
  }
}
