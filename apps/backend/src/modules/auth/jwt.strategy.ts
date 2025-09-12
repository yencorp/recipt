import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UsersService } from "../users/users.service";
import { User } from "../../entities/user.entity";

export interface JwtPayload {
  sub: string; // 사용자 ID
  email: string;
  role: string;
  iat?: number; // issued at
  exp?: number; // expiration time
  type: "access" | "refresh";
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET"),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const { sub: userId, type } = payload;

    // Refresh Token은 토큰 갱신 엔드포인트에서만 허용
    if (type === "refresh") {
      throw new UnauthorizedException(
        "Refresh token은 일반 인증에 사용할 수 없습니다."
      );
    }

    // 사용자 정보 조회
    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new UnauthorizedException("사용자를 찾을 수 없습니다.");
    }

    // 사용자 상태 확인
    if (user.status !== "ACTIVE") {
      throw new UnauthorizedException("활성화되지 않은 사용자입니다.");
    }

    // 비밀번호 정보는 제외하고 반환
    delete user.passwordHash;

    return user;
  }
}
