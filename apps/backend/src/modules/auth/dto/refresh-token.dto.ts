import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class RefreshTokenDto {
  @ApiProperty({
    description: "Refresh Token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    required: true,
  })
  @IsString({ message: "Refresh Token은 문자열이어야 합니다." })
  @IsNotEmpty({ message: "Refresh Token은 필수 입력 항목입니다." })
  refreshToken: string;
}
