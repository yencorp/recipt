import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
import { User, UserStatus } from "../../entities/user.entity";
import { EmailService } from "../email/email.service";
import * as crypto from "crypto";
import { JwtPayload } from "./jwt.strategy";
import { RegisterDto } from "./dto/register.dto";
import * as bcrypt from "bcrypt";
import { EmailNotVerifiedException } from "./exceptions/email-not-verified.exception";

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
    private readonly usersService: UsersService,
    private readonly emailService: EmailService
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

  async register(
    registerDto: RegisterDto
  ): Promise<{ message: string; email: string }> {
    // 1. 비밀번호 확인 검증
    if (registerDto.password !== registerDto.passwordConfirm) {
      throw new BadRequestException("비밀번호가 일치하지 않습니다.");
    }

    // 2. 비밀번호 해싱
    const saltRounds = parseInt(
      this.configService.get<string>("BCRYPT_SALT_ROUNDS", "10"),
      10
    );
    const passwordHash = await bcrypt.hash(registerDto.password, saltRounds);

    // 3. 이메일 인증 토큰 생성 및 이메일 발송 먼저 시도
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailSent = await this.emailService.sendVerificationEmail(
      registerDto.email,
      registerDto.name,
      emailVerificationToken
    );

    // 4. 이메일 발송 실패 시 계정 생성하지 않음
    if (!emailSent) {
      throw new BadRequestException(
        "인증 이메일 발송에 실패했습니다. 이메일 주소를 확인하거나 잠시 후 다시 시도해주세요."
      );
    }

    // 5. 이메일 발송 성공 시에만 사용자 생성 (이메일 중복 확인은 UsersService에서 처리)
    const user = await this.usersService.create({
      email: registerDto.email,
      passwordHash,
      name: registerDto.name,
      phone: registerDto.phone,
      role: registerDto.role,
    });

    // 6. 생성된 사용자에 이메일 인증 토큰 저장
    user.emailVerificationToken = emailVerificationToken;
    await this.usersService.update(user.id, {
      emailVerificationToken,
    });

    // 7. 가입 완료 메시지 반환 (JWT 토큰은 이메일 인증 후 로그인 시 발급)
    return {
      message:
        "회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해 주세요.",
      email: user.email,
    };
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException(
        "이메일 또는 비밀번호가 올바르지 않습니다."
      );
    }

    // 사용자 상태 확인
    if (user.status === UserStatus.PENDING_VERIFICATION) {
      throw new EmailNotVerifiedException(user.email);
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException(
        "비활성화된 계정입니다. 관리자에게 문의해 주세요."
      );
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException(
        "정지된 계정입니다. 관리자에게 문의해 주세요."
      );
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("로그인할 수 없는 계정 상태입니다.");
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

  async verifyEmail(token: string): Promise<{ message: string }> {
    // 1. 토큰으로 사용자 찾기
    const users = await this.usersService.findAll();
    const user = users.find((u) => u.emailVerificationToken === token);

    if (!user) {
      throw new BadRequestException(
        "유효하지 않거나 만료된 인증 토큰입니다."
      );
    }

    // 2. 이미 인증된 경우
    if (user.emailVerifiedAt) {
      throw new BadRequestException("이미 인증된 계정입니다.");
    }

    // 3. 이메일 인증 처리 (User 엔티티의 verifyEmail 메서드 사용)
    user.verifyEmail();
    await this.usersService.update(user.id, {
      emailVerifiedAt: user.emailVerifiedAt,
      emailVerificationToken: null,
      status: user.status,
    });

    return {
      message: "이메일 인증이 완료되었습니다. 이제 로그인할 수 있습니다.",
    };
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    // 1. 사용자 찾기
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new BadRequestException("존재하지 않는 이메일 주소입니다.");
    }

    // 2. 이미 인증된 경우
    if (user.emailVerifiedAt) {
      throw new BadRequestException("이미 인증된 계정입니다.");
    }

    // 3. 새로운 인증 토큰 생성
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    await this.usersService.update(user.id, {
      emailVerificationToken,
    });

    // 4. 이메일 재발송
    await this.emailService.sendVerificationEmail(
      user.email,
      user.name,
      emailVerificationToken
    );

    return {
      message: "인증 이메일이 재발송되었습니다. 이메일을 확인해 주세요.",
    };
  }
}
