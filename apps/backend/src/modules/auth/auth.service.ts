import { Injectable } from "@nestjs/common";

@Injectable()
export class AuthService {
  async login(_loginDto: any) {
    // TODO: 로그인 로직 구현
    // 1. 사용자 인증 확인
    // 2. JWT 토큰 생성
    // 3. 로그인 정보 기록
    throw new Error("Method not implemented.");
  }

  async register(_registerDto: any) {
    // TODO: 사용자 등록 로직 구현
    // 1. 이메일 중복 확인
    // 2. 비밀번호 해싱
    // 3. 사용자 생성
    // 4. 이메일 인증 발송
    throw new Error("Method not implemented.");
  }

  async validateUser(_email: string, _password: string) {
    // TODO: 사용자 유효성 검증 로직 구현
    throw new Error("Method not implemented.");
  }
}
