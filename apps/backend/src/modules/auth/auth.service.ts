import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
import { User, UserStatus } from "../../entities/user.entity";
import { JwtPayload } from "./jwt.strategy";
import * as bcrypt from "bcrypt";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  user: Partial<Omit<User, "passwordHash">>;
  tokens: AuthTokens;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService
  ) {}

  async login(email: string, password: string): Promise<LoginResponse> {
    // 1. 사용자 인증 확인
    const user = await this.validateUser(email, password);

    // 2. JWT 토큰 생성
    const tokens = await this.generateTokens(user);

    // 3. 로그인 정보 기록 (lastLoginAt 업데이트)
    await this.usersService.updateLastLogin(user.id);

    // 비밀번호 제외하고 사용자 정보 반환
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  async register(_registerDto: any) {
    // TODO: Task 3.5에서 구현 예정
    // 1. 이메일 중복 확인
    // 2. 비밀번호 해싱
    // 3. 사용자 생성
    // 4. 이메일 인증 발송
    throw new Error("Method not implemented.");
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException(
        "이메일 또는 비밀번호가 올바르지 않습니다."
      );
    }

    // 사용자 상태 확인
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("계정이 활성화되지 않았습니다.");
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        "이메일 또는 비밀번호가 올바르지 않습니다."
      );
    }

    return user;
  }

  async generateTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: "access",
    };

    const refreshPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: "refresh",
    };

    // Access Token (15분)
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>("JWT_SECRET"),
      expiresIn: this.configService.get<string>("JWT_EXPIRES_IN", "15m"),
    });

    // Refresh Token (7일)
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.configService.get<string>("JWT_SECRET"),
      expiresIn: this.configService.get<string>("JWT_REFRESH_EXPIRES_IN", "7d"),
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15분을 초로 변환
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      // Refresh Token 검증
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: this.configService.get<string>("JWT_SECRET"),
        }
      );

      // Refresh Token 타입 확인
      if (payload.type !== "refresh") {
        throw new UnauthorizedException("유효하지 않은 Refresh Token입니다.");
      }

      // 사용자 정보 조회
      const user = await this.usersService.findOne(payload.sub);

      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException("사용자를 찾을 수 없습니다.");
      }

      // 새 토큰들 생성
      return this.generateTokens(user);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new UnauthorizedException(
          "Refresh Token이 만료되었습니다. 다시 로그인해주세요."
        );
      }
      throw new UnauthorizedException("유효하지 않은 Refresh Token입니다.");
    }
  }

  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>("JWT_SECRET"),
      });

      if (payload.type !== "access") {
        throw new UnauthorizedException("유효하지 않은 Access Token입니다.");
      }

      return payload;
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new UnauthorizedException("토큰이 만료되었습니다.");
      }
      throw new UnauthorizedException("유효하지 않은 토큰입니다.");
    }
  }
}
