import { Controller, Post, Body, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { Public } from "../../common/decorators/public.decorator";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";

@ApiTags("Authentication")
@Controller("auth")
@Public()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @ApiOperation({ summary: "사용자 로그인" })
  @ApiResponse({ status: 200, description: "로그인 성공" })
  @ApiResponse({ status: 401, description: "인증 실패" })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post("register")
  @ApiOperation({ summary: "사용자 등록" })
  @ApiResponse({ status: 201, description: "사용자 등록 성공" })
  @ApiResponse({ status: 400, description: "잘못된 요청" })
  @ApiResponse({ status: 409, description: "이미 사용 중인 이메일" })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post("refresh")
  @ApiOperation({ summary: "토큰 갱신" })
  @ApiResponse({ status: 200, description: "토큰 갱신 성공" })
  @ApiResponse({ status: 401, description: "유효하지 않은 Refresh Token" })
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @Get("verify-email")
  @ApiOperation({ summary: "이메일 인증" })
  @ApiResponse({ status: 200, description: "이메일 인증 성공" })
  @ApiResponse({ status: 400, description: "유효하지 않은 인증 토큰" })
  async verifyEmail(@Query("token") token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post("resend-verification")
  @ApiOperation({ summary: "인증 이메일 재발송" })
  @ApiResponse({ status: 200, description: "인증 이메일 재발송 성공" })
  @ApiResponse({ status: 400, description: "잘못된 요청" })
  async resendVerificationEmail(@Body("email") email: string) {
    return this.authService.resendVerificationEmail(email);
  }
}
