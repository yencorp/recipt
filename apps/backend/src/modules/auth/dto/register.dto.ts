import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsEnum,
} from "class-validator";
import { UserRole } from "../../../entities/user.entity";

export class RegisterDto {
  @ApiProperty({
    description: "사용자 이메일 주소",
    example: "user@example.com",
    required: true,
  })
  @IsEmail({}, { message: "유효한 이메일 주소를 입력해주세요." })
  @IsNotEmpty({ message: "이메일은 필수 입력 항목입니다." })
  email: string;

  @ApiProperty({
    description: "비밀번호 (8-20자, 영문/숫자/특수문자 포함)",
    example: "Password123!",
    minLength: 8,
    maxLength: 20,
    required: true,
  })
  @IsString({ message: "비밀번호는 문자열이어야 합니다." })
  @IsNotEmpty({ message: "비밀번호는 필수 입력 항목입니다." })
  @MinLength(8, { message: "비밀번호는 최소 8자 이상이어야 합니다." })
  @MaxLength(20, { message: "비밀번호는 최대 20자 이하여야 합니다." })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]/, {
    message: "비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.",
  })
  password: string;

  @ApiProperty({
    description: "비밀번호 확인",
    example: "Password123!",
    required: true,
  })
  @IsString({ message: "비밀번호 확인은 문자열이어야 합니다." })
  @IsNotEmpty({ message: "비밀번호 확인은 필수 입력 항목입니다." })
  passwordConfirm: string;

  @ApiProperty({
    description: "사용자 이름",
    example: "홍길동",
    minLength: 2,
    maxLength: 50,
    required: true,
  })
  @IsString({ message: "이름은 문자열이어야 합니다." })
  @IsNotEmpty({ message: "이름은 필수 입력 항목입니다." })
  @MinLength(2, { message: "이름은 최소 2자 이상이어야 합니다." })
  @MaxLength(50, { message: "이름은 최대 50자 이하여야 합니다." })
  name: string;

  @ApiProperty({
    description: "전화번호 (선택 사항)",
    example: "010-1234-5678",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "전화번호는 문자열이어야 합니다." })
  @Matches(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, {
    message: "유효한 휴대전화 번호를 입력해주세요.",
  })
  phone?: string;

  @ApiProperty({
    description: "사용자 역할",
    enum: UserRole,
    default: UserRole.MEMBER,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: "유효한 사용자 역할을 선택해주세요." })
  role?: UserRole;
}
