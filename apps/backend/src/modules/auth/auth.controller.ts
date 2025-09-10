import { Controller, Post, Body } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AuthService } from "./auth.service";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @ApiOperation({ summary: "사용자 로그인" })
  @ApiResponse({ status: 200, description: "로그인 성공" })
  @ApiResponse({ status: 401, description: "인증 실패" })
  async login(@Body() loginDto: any) {
    // TODO: DTO 클래스 구현 필요
    return this.authService.login(loginDto);
  }

  @Post("register")
  @ApiOperation({ summary: "사용자 등록" })
  @ApiResponse({ status: 201, description: "사용자 등록 성공" })
  @ApiResponse({ status: 400, description: "잘못된 요청" })
  async register(@Body() registerDto: any) {
    // TODO: DTO 클래스 구현 필요
    return this.authService.register(registerDto);
  }
}
