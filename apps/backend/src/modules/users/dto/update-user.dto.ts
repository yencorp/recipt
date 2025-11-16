import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  Length,
  Matches,
  IsObject,
} from "class-validator";

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: "사용자 이름",
    example: "홍길동",
    minLength: 2,
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: "이름은 문자열이어야 합니다." })
  @Length(2, 50, { message: "이름은 2자 이상 50자 이하여야 합니다." })
  name?: string;

  @ApiPropertyOptional({
    description: "전화번호 (하이픈 포함 가능)",
    example: "010-1234-5678",
    maxLength: 20,
  })
  @IsOptional()
  @IsString({ message: "전화번호는 문자열이어야 합니다." })
  @Matches(/^[0-9-+()]{10,20}$/, {
    message: "올바른 전화번호 형식이 아닙니다.",
  })
  phone?: string;

  @ApiPropertyOptional({
    description: "프로필 이미지 URL",
    example: "https://example.com/profile.jpg",
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: "프로필 이미지 URL은 문자열이어야 합니다." })
  @Length(1, 500, {
    message: "프로필 이미지 URL은 1자 이상 500자 이하여야 합니다.",
  })
  profileImageUrl?: string;

  @ApiPropertyOptional({
    description: "사용자 추가 설정 (JSON 객체)",
    example: { theme: "dark", notifications: true },
  })
  @IsOptional()
  @IsObject({ message: "추가 설정은 객체여야 합니다." })
  preferences?: Record<string, any>;
}
