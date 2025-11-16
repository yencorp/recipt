import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { UserRole, UserStatus } from "../../../../entities/user.entity";

export class AdminUpdateUserDto {
  @ApiProperty({
    description: "사용자 이름",
    example: "홍길동",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    description: "전화번호",
    example: "010-1234-5678",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({
    description: "사용자 역할 (관리자만 변경 가능)",
    enum: UserRole,
    example: UserRole.MEMBER,
    required: false,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({
    description: "계정 상태 (관리자만 변경 가능)",
    enum: UserStatus,
    example: UserStatus.ACTIVE,
    required: false,
  })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}
