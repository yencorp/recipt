import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @ApiProperty({
    description: "사용자 이메일 주소",
    example: "user@example.com",
    required: true,
  })
  @IsEmail({}, { message: "유효한 이메일 주소를 입력해주세요." })
  @IsNotEmpty({ message: "이메일은 필수 입력 항목입니다." })
  email: string;

  @ApiProperty({
    description: "비밀번호",
    example: "Password123!",
    required: true,
  })
  @IsString({ message: "비밀번호는 문자열이어야 합니다." })
  @IsNotEmpty({ message: "비밀번호는 필수 입력 항목입니다." })
  password: string;
}
