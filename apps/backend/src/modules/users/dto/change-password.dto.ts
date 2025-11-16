import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength, Matches } from "class-validator";

export class ChangePasswordDto {
  @ApiProperty({
    description: "현재 비밀번호",
    example: "CurrentP@ssw0rd!",
  })
  @IsString({ message: "현재 비밀번호는 문자열이어야 합니다." })
  currentPassword: string;

  @ApiProperty({
    description: "새 비밀번호 (8자 이상, 영문/숫자/특수문자 포함)",
    example: "NewP@ssw0rd!",
  })
  @IsString({ message: "새 비밀번호는 문자열이어야 합니다." })
  @MinLength(8, { message: "비밀번호는 최소 8자 이상이어야 합니다." })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]/, {
    message: "비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.",
  })
  newPassword: string;

  @ApiProperty({
    description: "새 비밀번호 확인",
    example: "NewP@ssw0rd!",
  })
  @IsString({ message: "새 비밀번호 확인은 문자열이어야 합니다." })
  newPasswordConfirm: string;
}
