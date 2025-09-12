import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../../entities/user.entity";

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
